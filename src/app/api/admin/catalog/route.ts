import { NextResponse } from "next/server";
import { PartCategory } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizePartCode } from "@/lib/vin";

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

export async function GET() {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parts = await prisma.catalogPart.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ parts });
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
