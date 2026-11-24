import { NextResponse } from "next/server";
import { PartCategory, type Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizePartCode } from "@/lib/vin";

const VALID_CATEGORIES = new Set<string>(Object.values(PartCategory));

const createCatalogPartSchema = z.object({
  oemCode: z.string().min(1, "OEM kodu zorunludur."),
  hwCode: z.string().optional(),
  swCode: z.string().optional(),
  crossRefCodes: z.array(z.string()).default([]),
  category: z.nativeEnum(PartCategory).default(PartCategory.ECU),
  brand: z.string().min(1, "Marka zorunludur."),
  model: z.string().min(1, "Model zorunludur."),
  yearRange: z.string().optional(),
  engineCode: z.string().optional(),
  manufacturer: z.string().min(1, "Üretici zorunludur."),
  condition: z.string().optional(),
  imageUrl: z.string().optional(),
  referencePrice: z.coerce.number().positive().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q")?.trim() || "";
  const brand = searchParams.get("brand")?.trim() || "";
  const category = searchParams.get("category")?.trim().toUpperCase() || "";
  const manufacturer = searchParams.get("manufacturer")?.trim() || "";
  const featured = searchParams.get("featured")?.trim().toLowerCase() || "";

  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawLimit = Number.parseInt(searchParams.get("limit") || "25", 10);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, 1000)
      : 25;
  const skip = (page - 1) * limit;

  const where: Prisma.CatalogPartWhereInput = {};

  if (brand && brand.toUpperCase() !== "ALL") {
    where.brand = { equals: brand, mode: "insensitive" };
  }

  if (category && category !== "ALL" && VALID_CATEGORIES.has(category)) {
    where.category = category as PartCategory;
  }

  if (manufacturer && manufacturer.toUpperCase() !== "ALL") {
    where.manufacturer = { contains: manufacturer, mode: "insensitive" };
  }

  if (featured === "true") {
    where.isFeatured = true;
  }

  if (q) {
    const normalizedQ = normalizePartCode(q);
    const orConditions: Prisma.CatalogPartWhereInput[] = [
      { oemCode: { contains: q, mode: "insensitive" } },
      { hwCode: { contains: q, mode: "insensitive" } },
      { swCode: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { engineCode: { contains: q, mode: "insensitive" } },
      { manufacturer: { contains: q, mode: "insensitive" } },
    ];

    if (normalizedQ) {
      orConditions.push(
        { normalizedCode: { contains: normalizedQ, mode: "insensitive" } },
        { hwCode: { contains: normalizedQ, mode: "insensitive" } },
        { swCode: { contains: normalizedQ, mode: "insensitive" } },
        { crossRefCodes: { has: normalizedQ } }
      );
    }

    where.OR = orConditions;
  }

  const [
    items,
    total,
    totalAll,
    featuredCount,
    distinctBrands,
    distinctManufacturers,
    groupedCategories,
  ] = await Promise.all([
    prisma.catalogPart.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.catalogPart.count({ where }),
    prisma.catalogPart.count(),
    prisma.catalogPart.count({ where: { isFeatured: true } }),
    prisma.catalogPart.findMany({
      distinct: ["brand"],
      select: { brand: true },
      orderBy: { brand: "asc" },
    }),
    prisma.catalogPart.findMany({
      distinct: ["manufacturer"],
      select: { manufacturer: true },
      orderBy: { manufacturer: "asc" },
    }),
    prisma.catalogPart.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
  ]);

  const brands = distinctBrands
    .map((entry) => entry.brand)
    .filter((value): value is string => Boolean(value));

  const manufacturers = distinctManufacturers
    .map((entry) => entry.manufacturer)
    .filter((value): value is string => Boolean(value));

  const categoryCounts: Record<string, number> = {};
  for (const row of groupedCategories) {
    categoryCounts[row.category] = row._count._all;
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    items,
    parts: items,
    total,
    page,
    limit,
    totalPages,
    stats: {
      totalAll,
      featuredCount,
      brandCount: brands.length,
      manufacturerCount: manufacturers.length,
      brands,
      manufacturers,
      categoryCounts,
    },
  });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = createCatalogPartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz katalog parçası verisi.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const normalizedCrossRefs = Array.from(
    new Set(
      parsed.data.crossRefCodes
        .map((c) => normalizePartCode(c))
        .filter((c) => c.length > 0)
    )
  );

  const part = await prisma.catalogPart.create({
    data: {
      oemCode: parsed.data.oemCode,
      normalizedCode: normalizePartCode(parsed.data.oemCode),
      hwCode: parsed.data.hwCode,
      swCode: parsed.data.swCode,
      crossRefCodes: normalizedCrossRefs,
      category: parsed.data.category,
      brand: parsed.data.brand,
      model: parsed.data.model,
      yearRange: parsed.data.yearRange,
      engineCode: parsed.data.engineCode,
      manufacturer: parsed.data.manufacturer,
      ...(parsed.data.condition ? { condition: parsed.data.condition } : {}),
      imageUrl: parsed.data.imageUrl,
      referencePrice: parsed.data.referencePrice,
      isFeatured: parsed.data.isFeatured ?? false,
    },
  });

  return NextResponse.json({ part }, { status: 201 });
}
