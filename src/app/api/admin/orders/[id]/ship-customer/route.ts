import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCargoLabel } from "@/lib/adapters/cargo";
import { sendNotification } from "@/lib/adapters/notifications";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      testLabRecord: true,
      inquiry: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  if (order.testLabRecord?.result !== "PASS") {
    return NextResponse.json(
      { error: "Test Lab onayı (PASS) olmadan müşteriye kargo çıkışı yapılamaz." },
      { status: 400 }
    );
  }

  const cargoLabel = generateCargoLabel("OUTBOUND_TO_CUSTOMER", order.orderNo);
  const returnDeadlineAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      outboundCargoCode: cargoLabel.cargoCode,
      outboundTrackingNo: cargoLabel.trackingNo,
      status: "SHIPPED_TO_CUSTOMER",
      returnDeadlineAt,
    },
  });

  await prisma.inquiry.update({
    where: { id: order.inquiryId },
    data: { status: "SHIPPED_TO_CUSTOMER" },
  });

  await sendNotification({
    channel: "SMS",
    recipient: order.inquiry.customerPhone,
    template: "CUSTOMER_SHIPPED",
    message: `Sayın Müşterimiz, ${order.orderNo} numaralı siparişiniz Test Lab onayından geçerek kargoya verilmiştir. Kargo Kodu: ${cargoLabel.cargoCode}, Takip No: ${cargoLabel.trackingNo}. 14 gün koşulsuz iade güvenceniz başlamıştır.`,
    relatedInquiryId: order.inquiryId,
  });

  return NextResponse.json({ order: updatedOrder, cargoLabel });
}
