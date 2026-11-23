import { NextResponse } from "next/server";
import { PartCategory, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizePartCode } from "@/lib/vin";

const VALID_CATEGORIES = new Set<string>(Object.values(PartCategory));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim().toUpperCase() || "";
  const brand = searchParams.get("brand")?.trim() || "";

  const where: Prisma.CatalogPartWhereInput = {};

  if (category && category !== "ALL" && VALID_CATEGORIES.has(category)) {
    where.category = category as PartCategory;
  }

  if (brand && brand.toUpperCase() !== "ALL") {
    where.brand = { contains: brand, mode: "insensitive" };
  }

  if (q) {
    const normalizedQ = normalizePartCode(q);
    const orConditions: Prisma.CatalogPartWhereInput[] = [
      { oemCode: { contains: q, mode: "insensitive" } },
      { hwCode: { contains: q, mode: "insensitive" } },
      { swCode: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
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

  const items = await prisma.catalogPart.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    items,
    total: items.length,
  });
}
