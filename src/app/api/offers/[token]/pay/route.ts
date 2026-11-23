import crypto from "node:crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { processEscrowPayment } from "@/lib/adapters/payment";
import { generateCargoLabel } from "@/lib/adapters/cargo";
import { sendNotification } from "@/lib/adapters/notifications";

const payOfferSchema = z.object({
  cardHolderName: z
    .string()
    .trim()
    .min(2, "Kart üzerindeki ad soyad alanı zorunludur."),
  cardNumber: z
    .string()
    .trim()
    .refine(
      (val) => val.replace(/\D/g, "").length >= 12,
      "Geçerli bir kart numarası giriniz."
    ),
  deliveryAddress: z
    .string()
    .trim()
    .min(10, "Teslimat adresi en az 10 karakter olmalıdır."),
  invoiceType: z.enum(["INDIVIDUAL", "CORPORATE"]),
  taxInfo: z.record(z.unknown()).optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token || !token.trim()) {
    return NextResponse.json(
      { error: "Teklif anahtarı geçersiz." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const parsed = payOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Ödeme bilgileri geçersiz." },
      { status: 400 }
    );
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { paymentToken: token.trim() },
    include: { order: true },
  });

  if (!inquiry) {
    return NextResponse.json(
      { error: "Teklif bulunamadı veya süresi dolmuş." },
      { status: 404 }
    );
  }

  if (inquiry.order) {
    return NextResponse.json(
      { error: "Bu teklif için ödeme zaten alınmıştır." },
      { status: 409 }
    );
  }

  if (!inquiry.selectedOfferId || inquiry.customerOfferPrice == null) {
    return NextResponse.json(
      { error: "Bu talep için onaylanmış bir müşteri teklifi bulunmuyor." },
      { status: 400 }
    );
  }

  const acceptedOffer = await prisma.supplierOffer.findUnique({
    where: { id: inquiry.selectedOfferId },
  });

  if (!acceptedOffer) {
    return NextResponse.json(
      { error: "Seçili tedarikçi teklifi bulunamadı." },
      { status: 400 }
    );
  }

  const orderNo = `SIP-${crypto.randomInt(100000, 999999)}`;
  const cleanCard = parsed.data.cardNumber.replace(/\D/g, "");
  const cardLast4 = cleanCard.slice(-4);

  const payment = await processEscrowPayment({
    orderNo,
    amount: inquiry.customerOfferPrice,
    cardHolderName: parsed.data.cardHolderName,
    cardLast4,
  });

  if (!payment.success) {
    return NextResponse.json(
      { error: "Güvence hesabı ödemesi onaylanamadı." },
      { status: 402 }
    );
  }

  const inboundCargo = generateCargoLabel("INBOUND_TO_HUB", orderNo);
  const shippingCost = 350;
  const netProfit =
    inquiry.customerOfferPrice - acceptedOffer.purchasePrice - shippingCost;

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        orderNo,
        inquiryId: inquiry.id,
        supplierId: acceptedOffer.supplierId,
        customerPrice: inquiry.customerOfferPrice!,
        purchasePrice: acceptedOffer.purchasePrice,
        shippingCost,
        netProfit,
        paymentStatus: payment.escrowStatus,
        paymentRef: payment.paymentRef,
        inboundCargoCode: inboundCargo.cargoCode,
        inboundTrackingNo: inboundCargo.trackingNo,
        deliveryAddress: parsed.data.deliveryAddress,
        invoiceType: parsed.data.invoiceType,
        taxInfoJson: parsed.data.taxInfo
          ? (parsed.data.taxInfo as Prisma.InputJsonValue)
          : undefined,
        status: "PAID",
      },
    });

    await tx.inquiry.update({
      where: { id: inquiry.id },
      data: { status: "PAID" },
    });

    return createdOrder;
  });

  try {
    await sendNotification({
      channel: "SMS",
      recipient: inquiry.customerPhone,
      template: "PAYMENT_CONFIRMED",
      message: `Sayın Müşterimiz, ${order.orderNo} numaralı siparişiniz için güvence ödemeniz alınmıştır. Parça test laboratuvarımıza sevk edilmek üzeredir.`,
      relatedInquiryId: inquiry.id,
    });
  } catch (err) {
    console.error("Payment notification log failed:", err);
  }

  return NextResponse.json(
    {
      order: {
        orderNo: order.orderNo,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentRef: order.paymentRef,
        customerPrice: order.customerPrice,
      },
    },
    { status: 201 }
  );
}
