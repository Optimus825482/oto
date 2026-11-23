import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PartCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { normalizePartCode } from "@/lib/vin";

const importItemSchema = z.object({
  oemCode: z.string().min(3),
  hwCode: z.string().optional(),
  swCode: z.string().optional(),
  crossRefCodes: z.array(z.string()).optional(),
  category: z.nativeEnum(PartCategory).default(PartCategory.ECU),
  brand: z.string().min(2),
  model: z.string().min(2),
  yearRange: z.string().optional(),
  engineCode: z.string().optional(),
  manufacturer: z.string().min(2),
  referencePrice: z.number().positive().optional(),
  isFeatured: z.boolean().optional(),
});

const bulkImportSchema = z.object({
  items: z.array(importItemSchema).min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = bulkImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "İçe aktarma verisi geçersiz.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let inserted = 0;
  let updated = 0;

  for (const item of parsed.data.items) {
    const normalizedCode = normalizePartCode(item.oemCode);
    const crossRefs = Array.from(
      new Set([
        normalizedCode,
        ...(item.hwCode ? [normalizePartCode(item.hwCode)] : []),
        ...(item.crossRefCodes ?? []).map(normalizePartCode),
      ])
    ).filter(Boolean);

    const existing = await prisma.catalogPart.findFirst({
      where: { normalizedCode },
    });

    if (existing) {
      await prisma.catalogPart.update({
        where: { id: existing.id },
        data: {
          oemCode: item.oemCode,
          hwCode: item.hwCode ?? existing.hwCode,
          swCode: item.swCode ?? existing.swCode,
          crossRefCodes: Array.from(new Set([...existing.crossRefCodes, ...crossRefs])),
          category: item.category,
          brand: item.brand,
          model: item.model,
          yearRange: item.yearRange ?? existing.yearRange,
          engineCode: item.engineCode ?? existing.engineCode,
          manufacturer: item.manufacturer,
          referencePrice: item.referencePrice ?? existing.referencePrice,
          isFeatured: item.isFeatured ?? existing.isFeatured,
        },
      });
      updated++;
    } else {
      await prisma.catalogPart.create({
        data: {
          oemCode: item.oemCode,
          normalizedCode,
          hwCode: item.hwCode,
          swCode: item.swCode,
          crossRefCodes: crossRefs,
          category: item.category,
          brand: item.brand,
          model: item.model,
          yearRange: item.yearRange,
          engineCode: item.engineCode,
          manufacturer: item.manufacturer,
          referencePrice: item.referencePrice,
          isFeatured: item.isFeatured ?? false,
        },
      });
      inserted++;
    }
  }

  const total = await prisma.catalogPart.count();
  return NextResponse.json({
    ok: true,
    inserted,
    updated,
    total,
  });
}
