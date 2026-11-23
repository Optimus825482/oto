import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token || !token.trim()) {
    return NextResponse.json(
      { error: "Teklif anahtarı geçersiz." },
      { status: 400 }
    );
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { paymentToken: token.trim() },
    select: {
      code: true,
      partCode: true,
      vin: true,
      brand: true,
      category: true,
      status: true,
      customerOfferPrice: true,
      createdAt: true,
      order: {
        select: {
          orderNo: true,
          paymentStatus: true,
        },
      },
    },
  });

  if (!inquiry) {
    return NextResponse.json(
      { error: "Teklif bulunamadı veya süresi dolmuş." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    offer: {
      code: inquiry.code,
      partCode: inquiry.partCode,
      vin: inquiry.vin,
      brand: inquiry.brand,
      category: inquiry.category,
      status: inquiry.status,
      customerOfferPrice: inquiry.customerOfferPrice,
      createdAt: inquiry.createdAt,
      orderNo: inquiry.order?.orderNo ?? null,
      paymentStatus: inquiry.order?.paymentStatus ?? null,
    },
  });
}
