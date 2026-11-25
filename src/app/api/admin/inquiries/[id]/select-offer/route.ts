import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateCustomerPrice } from "@/lib/pricing";
import { formatTRY } from "@/types/domain";
import {
  buildCustomerQuoteSms,
  sendNotification,
} from "@/lib/adapters/notifications";

const selectOfferSchema = z.object({
  offerId: z.string().min(1, "Teklif ID zorunludur."),
  marginPercent: z.coerce.number().min(5).max(80).default(22),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = selectOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz teklif seçimi verisi.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  const offer = await prisma.supplierOffer.findFirst({
    where: { id: parsed.data.offerId, inquiryId: id },
  });
  if (!offer) {
    return NextResponse.json(
      { error: "Bu talebe ait tedarikçi teklifi bulunamadı." },
      { status: 404 }
    );
  }

  const pricing = calculateCustomerPrice(
    offer.purchasePrice,
    parsed.data.marginPercent
  );
  const paymentToken = crypto.randomBytes(8).toString("hex");

  await prisma.supplierOffer.update({
    where: { id: offer.id },
    data: { status: "ACCEPTED" },
  });

  await prisma.supplierOffer.updateMany({
    where: {
      inquiryId: id,
      id: { not: offer.id },
    },
    data: { status: "REJECTED" },
  });

  const updatedInquiry = await prisma.inquiry.update({
    where: { id },
    data: {
      selectedOfferId: offer.id,
      marginPercent: pricing.marginPercent,
      customerOfferPrice: pricing.customerPrice,
      paymentToken,
      status: "OFFER_SENT",
    },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const offerUrl = `${baseUrl}/teklif/${paymentToken}`;

  const smsPreview = buildCustomerQuoteSms({
    partCode: inquiry.partCode || inquiry.code,
    customerPriceFormatted: formatTRY(pricing.customerPrice),
    offerUrl,
  });

  await sendNotification({
    channel: "SMS",
    recipient: inquiry.customerPhone,
    template: "CUSTOMER_QUOTE",
    message: smsPreview,
    relatedInquiryId: inquiry.id,
  });

  return NextResponse.json({
    inquiry: updatedInquiry,
    pricing,
    offerUrl,
    smsPreview,
  });
}
