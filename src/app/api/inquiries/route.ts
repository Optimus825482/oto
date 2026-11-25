import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { PartCategory, type Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { decodeVin, normalizePartCode, type VinDecodeResult } from "@/lib/vin";
import { sendNotification } from "@/lib/adapters/notifications";

const createInquirySchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z
    .string()
    .trim()
    .min(10, "Geçerli bir cep telefonu numarası giriniz (en az 10 karakter)."),
  customerEmail: z
    .string()
    .trim()
    .email("Geçerli bir e-posta adresi giriniz.")
    .optional()
    .or(z.literal("")),
  partCode: z.string().trim().optional(),
  vin: z.string().trim().optional(),
  category: z.nativeEnum(PartCategory).optional(),
  brand: z.string().trim().optional(),
  note: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
});

function generateInquiryCode(): string {
  const digits = crypto.randomInt(100000, 999999);
  return `OBP-${digits}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const parsed = createInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Talep bilgileri geçersiz." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const partCode = data.partCode || undefined;
  const rawVin = data.vin || undefined;

  if (!partCode && !rawVin) {
    return NextResponse.json(
      {
        error:
          "Parça kodu veya 17 haneli şase numarası (VIN) alanlarından en az biri zorunludur.",
      },
      { status: 400 }
    );
  }

  let decodedVin: VinDecodeResult | null = null;
  if (rawVin) {
    decodedVin = decodeVin(rawVin);
    if (!decodedVin.valid) {
      return NextResponse.json(
        {
          error: decodedVin.error || "Geçersiz şase numarası (VIN).",
          valid: false,
          vin: decodedVin.vin,
        },
        { status: 400 }
      );
    }
  }

  const normalizedPartCode = partCode ? normalizePartCode(partCode) : null;
  const resolvedBrand = data.brand || decodedVin?.brand || null;
  const code = generateInquiryCode();

  const inquiry = await prisma.inquiry.create({
    data: {
      code,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      partCode: partCode || null,
      normalizedPartCode,
      vin: decodedVin?.vin ?? null,
      decodedVehicleJson: decodedVin
        ? (decodedVin as unknown as Prisma.InputJsonValue)
        : undefined,
      category: data.category ?? PartCategory.ECU,
      brand: resolvedBrand,
      note: data.note || null,
      photoUrl: data.photoUrl || null,
      status: "NEW",
    },
  });

  try {
    await sendNotification({
      channel: "SMS",
      recipient: inquiry.customerPhone,
      template: "INQUIRY_CREATED",
      message: `Sayın Müşterimiz, ${inquiry.code} takip numaralı beyin parça talebiniz alınmıştır. Onaylı tedarik ağımızda sorgulama başlatılmıştır.`,
      relatedInquiryId: inquiry.id,
    });
  } catch (err) {
    console.error("Inquiry notification log failed:", err);
  }

  return NextResponse.json(
    {
      inquiry: {
        code: inquiry.code,
        status: inquiry.status,
        partCode: inquiry.partCode,
        vin: inquiry.vin,
        brand: inquiry.brand,
        category: inquiry.category,
        createdAt: inquiry.createdAt,
      },
    },
    { status: 201 }
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawCode = searchParams.get("code")?.trim();

  if (!rawCode) {
    return NextResponse.json(
      { error: "Takip kodu (code) parametresi zorunludur." },
      { status: 400 }
    );
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { code: rawCode.toUpperCase() },
    select: {
      code: true,
      status: true,
      partCode: true,
      vin: true,
      brand: true,
      category: true,
      customerOfferPrice: true,
      paymentToken: true,
      createdAt: true,
      updatedAt: true,
      order: {
        select: {
          orderNo: true,
          status: true,
          paymentStatus: true,
          outboundCargoCode: true,
          outboundTrackingNo: true,
          invoiceNo: true,
          returnDeadlineAt: true,
          testLabRecord: {
            select: {
              certificateCode: true,
              result: true,
              testedAt: true,
            },
          },
        },
      },
    },
  });

  if (!inquiry) {
    return NextResponse.json(
      { error: "Bu takip koduna ait talep bulunamadı." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    inquiry: {
      code: inquiry.code,
      status: inquiry.status,
      partCode: inquiry.partCode,
      vin: inquiry.vin,
      brand: inquiry.brand,
      category: inquiry.category,
      customerOfferPrice: inquiry.customerOfferPrice,
      paymentToken: inquiry.paymentToken,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      order: inquiry.order
        ? {
            orderNo: inquiry.order.orderNo,
            status: inquiry.order.status,
            paymentStatus: inquiry.order.paymentStatus,
            outboundCargoCode: inquiry.order.outboundCargoCode,
            outboundTrackingNo: inquiry.order.outboundTrackingNo,
            invoiceNo: inquiry.order.invoiceNo,
            returnDeadlineAt: inquiry.order.returnDeadlineAt,
            certificateCode: inquiry.order.testLabRecord?.certificateCode ?? null,
            testResult: inquiry.order.testLabRecord?.result ?? null,
            testedAt: inquiry.order.testLabRecord?.testedAt ?? null,
          }
        : null,
    },
  });
}
