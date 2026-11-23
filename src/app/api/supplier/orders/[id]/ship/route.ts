import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCargoLabel, type CargoLabelResult } from "@/lib/adapters/cargo";
import { sendNotification } from "@/lib/adapters/notifications";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;

  const existing = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      orderNo: true,
      inquiryId: true,
      supplierId: true,
      status: true,
      inboundCargoCode: true,
      inboundTrackingNo: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  if (existing.supplierId !== supplierId) {
    return NextResponse.json(
      { error: "Bu siparişe erişim yetkiniz bulunmuyor." },
      { status: 403 }
    );
  }

  if (existing.status !== "PAID" && existing.status !== "SUPPLIER_SHIPPED") {
    return NextResponse.json(
      { error: "Bu sipariş merkeze sevk için uygun durumda değil." },
      { status: 400 }
    );
  }

  let cargoLabel: CargoLabelResult;
  if (!existing.inboundCargoCode || !existing.inboundTrackingNo) {
    cargoLabel = generateCargoLabel("INBOUND_TO_HUB", existing.orderNo);
  } else {
    cargoLabel = {
      carrier: "Anlaşmalı Ekspres Kargo (Yurtiçi / Aras)",
      cargoCode: existing.inboundCargoCode,
      trackingNo: existing.inboundTrackingNo,
      direction: "INBOUND_TO_HUB",
      packagingStandard: "Tedarikçi → OtoBeyinPazari Test Merkezi Sevk Kodu",
    };
  }

  const updatedOrder = await prisma.order.update({
    where: { id: existing.id },
    data: {
      status: "SUPPLIER_SHIPPED",
      inboundCargoCode: cargoLabel.cargoCode,
      inboundTrackingNo: cargoLabel.trackingNo,
    },
    select: {
      id: true,
      orderNo: true,
      purchasePrice: true,
      status: true,
      inboundCargoCode: true,
      inboundTrackingNo: true,
      createdAt: true,
    },
  });

  await prisma.inquiry.update({
    where: { id: existing.inquiryId },
    data: { status: "SUPPLIER_SHIPPED" },
  });

  await sendNotification({
    channel: "PANEL",
    recipient: "OPERATOR_HUB",
    template: "SUPPLIER_SHIPPED",
    message: `Sipariş ${existing.orderNo} tedarikçi tarafından test merkezine kargolandı (${cargoLabel.cargoCode}).`,
    relatedInquiryId: existing.inquiryId,
  });

  const order = {
    id: updatedOrder.id,
    orderNo: updatedOrder.orderNo,
    purchasePrice: updatedOrder.purchasePrice,
    status: updatedOrder.status,
    inboundCargoCode: updatedOrder.inboundCargoCode ?? null,
    inboundTrackingNo: updatedOrder.inboundTrackingNo ?? null,
    createdAt: updatedOrder.createdAt,
  };

  return NextResponse.json({ order, cargoLabel });
}
