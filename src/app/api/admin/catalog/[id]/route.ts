import { NextResponse } from "next/server";
import { PartCategory, type Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizePartCode } from "@/lib/vin";

const optionalNullableString = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const updateCatalogPartSchema = z.object({
  oemCode: z.string().trim().min(1, "OEM kodu boş olamaz.").optional(),
  hwCode: optionalNullableString,
  swCode: optionalNullableString,
  crossRefCodes: z.array(z.string()).optional(),
  category: z.nativeEnum(PartCategory).optional(),
  brand: z.string().trim().min(1, "Marka boş olamaz.").optional(),
  model: z.string().trim().min(1, "Model boş olamaz.").optional(),
  yearRange: optionalNullableString,
  engineCode: optionalNullableString,
  manufacturer: z.string().trim().min(1, "Üretici boş olamaz.").optional(),
  referencePrice: z
    .preprocess(
      (val) => (val === "" || val === null ? null : val),
      z.coerce.number().positive().nullable().optional()
    ),
  isFeatured: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const parsed = updateCatalogPartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz güncelleme verisi.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const existing = await prisma.catalogPart.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Katalog parçası bulunamadı." },
      { status: 404 }
    );
  }

  const data = parsed.data;
  const updateData: Prisma.CatalogPartUpdateInput = {};

  if (data.oemCode !== undefined) {
    updateData.oemCode = data.oemCode;
    updateData.normalizedCode = normalizePartCode(data.oemCode);
  }
  if (data.hwCode !== undefined) updateData.hwCode = data.hwCode;
  if (data.swCode !== undefined) updateData.swCode = data.swCode;
  if (data.crossRefCodes !== undefined) {
    updateData.crossRefCodes = Array.from(
      new Set(
        data.crossRefCodes
          .map((c) => normalizePartCode(c))
          .filter((c) => c.length > 0)
      )
    );
  }
  if (data.category !== undefined) updateData.category = data.category;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.yearRange !== undefined) updateData.yearRange = data.yearRange;
  if (data.engineCode !== undefined) updateData.engineCode = data.engineCode;
  if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
  if (data.referencePrice !== undefined) {
    updateData.referencePrice = data.referencePrice;
  }
  if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek alan belirtilmedi." },
      { status: 400 }
    );
  }

  const part = await prisma.catalogPart.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ part });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const existing = await prisma.catalogPart.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Katalog parçası bulunamadı." },
      { status: 404 }
    );
  }

  await prisma.catalogPart.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
