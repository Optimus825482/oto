import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
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

  const rows = await prisma.order.findMany({
    where: { supplierId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNo: true,
      purchasePrice: true,
      status: true,
      inboundCargoCode: true,
      inboundTrackingNo: true,
      createdAt: true,
      inquiry: {
        select: {
          code: true,
          partCode: true,
          brand: true,
          category: true,
          vin: true,
        },
      },
      testLabRecord: {
        select: {
          result: true,
          testedAt: true,
          notes: true,
        },
      },
    },
  });

  // Explicitly sanitize output to guarantee customerPrice, netProfit, deliveryAddress, and customer PII are never exposed
  const orders = rows.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    purchasePrice: order.purchasePrice,
    status: order.status,
    inboundCargoCode: order.inboundCargoCode ?? null,
    inboundTrackingNo: order.inboundTrackingNo ?? null,
    createdAt: order.createdAt,
    inquiry: order.inquiry
      ? {
          code: order.inquiry.code,
          partCode: order.inquiry.partCode ?? null,
          brand: order.inquiry.brand ?? null,
          category: order.inquiry.category,
          vin: order.inquiry.vin ?? null,
        }
      : null,
    testLabRecord: order.testLabRecord
      ? {
          result: order.testLabRecord.result,
          testedAt: order.testLabRecord.testedAt,
          notes: order.testLabRecord.notes ?? null,
        }
      : null,
  }));

  return NextResponse.json({ orders });
}
