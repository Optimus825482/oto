import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createOfferSchema = z.object({
  inquiryId: z.string().trim().min(1, "Talep ID zorunludur."),
  purchasePrice: z
    .number({ invalid_type_error: "Alış fiyatı sayı olmalıdır." })
    .finite()
    .positive("Alış fiyatı 0'dan büyük olmalıdır."),
  shippingDays: z
    .number({ invalid_type_error: "Kargo süresi sayı olmalıdır." })
    .int()
    .min(1, "Kargo süresi en az 1 gün olmalıdır.")
    .max(14, "Kargo süresi en fazla 14 gün olabilir.")
    .default(1),
  conditionNote: z
    .string()
    .trim()
    .min(3, "Durum notu en az 3 karakter olmalıdır."),
  photoUrl: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const auth = await requireRole(["SUPPLIER"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supplierId = auth.user.supplierId;
  if (!supplierId) {
    return NextResponse.json(
      { error: "Tedarikçi profili bulunamadı." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi." },
      { status: 400 }
    );
  }

  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Geçersiz teklif verisi.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { inquiryId, purchasePrice, shippingDays, conditionNote, photoUrl } =
    parsed.data;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, status: true },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  if (
    inquiry.status !== "BROADCASTED" &&
    inquiry.status !== "QUOTES_RECEIVED"
  ) {
    return NextResponse.json(
      { error: "Bu talep artık teklif kabul etmemektedir." },
      { status: 400 }
    );
  }

  const offer = await prisma.supplierOffer.upsert({
    where: {
      inquiryId_supplierId: {
        inquiryId,
        supplierId,
      },
    },
    create: {
      inquiryId,
      supplierId,
      purchasePrice,
      shippingDays,
      conditionNote,
      photoUrl: photoUrl || null,
    },
    update: {
      purchasePrice,
      shippingDays,
      conditionNote,
      photoUrl: photoUrl || null,
    },
  });

  if (inquiry.status === "BROADCASTED") {
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: { status: "QUOTES_RECEIVED" },
    });
  }

  return NextResponse.json({ offer }, { status: 201 });
}
