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

  const inquiries = await prisma.inquiry.findMany({
    where: {
      status: { in: ["BROADCASTED", "QUOTES_RECEIVED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      partCode: true,
      vin: true,
      decodedVehicleJson: true,
      category: true,
      brand: true,
      note: true,
      status: true,
      broadcastedAt: true,
      createdAt: true,
      offers: {
        where: { supplierId },
        select: {
          id: true,
          inquiryId: true,
          supplierId: true,
          purchasePrice: true,
          shippingDays: true,
          conditionNote: true,
          photoUrl: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  // Explicitly project only non-PII RFQ fields to enforce closed-network isolation
  const rfqs = inquiries.map((inq) => ({
    id: inq.id,
    code: inq.code,
    partCode: inq.partCode ?? null,
    vin: inq.vin ?? null,
    decodedVehicleJson: inq.decodedVehicleJson ?? null,
    category: inq.category,
    brand: inq.brand ?? null,
    note: inq.note ?? null,
    status: inq.status,
    broadcastedAt: inq.broadcastedAt ?? null,
    createdAt: inq.createdAt,
    myOffer: inq.offers?.[0] ?? null,
  }));

  return NextResponse.json({ rfqs });
}
