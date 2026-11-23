import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  if (!code || !code.trim()) {
    return NextResponse.json(
      { error: "Sertifika kodu geçersiz." },
      { status: 400 }
    );
  }

  const record = await prisma.testLabRecord.findUnique({
    where: { certificateCode: code.trim() },
    select: {
      serialNo: true,
      hologramSealCode: true,
      physicalCheckOk: true,
      pinCheckOk: true,
      canObdCheckOk: true,
      result: true,
      testedAt: true,
      notes: true,
      certificateCode: true,
      order: {
        select: {
          orderNo: true,
          invoiceNo: true,
          returnDeadlineAt: true,
          inquiry: {
            select: {
              partCode: true,
              brand: true,
              vin: true,
            },
          },
        },
      },
    },
  });

  if (!record || record.result !== "PASS") {
    return NextResponse.json(
      { error: "Geçerli test sertifikası bulunamadı." },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const certUrl = `${baseUrl}/sertifika/${record.certificateCode}`;
  const qrDataUrl = await QRCode.toDataURL(certUrl, {
    width: 220,
    margin: 1,
  });

  return NextResponse.json({
    certificate: {
      serialNo: record.serialNo,
      hologramSealCode: record.hologramSealCode,
      physicalCheckOk: record.physicalCheckOk,
      pinCheckOk: record.pinCheckOk,
      canObdCheckOk: record.canObdCheckOk,
      testedAt: record.testedAt,
      notes: record.notes,
      certificateCode: record.certificateCode,
      qrDataUrl,
      orderNo: record.order.orderNo,
      partCode: record.order.inquiry.partCode,
      brand: record.order.inquiry.brand,
      vin: record.order.inquiry.vin,
      invoiceNo: record.order.invoiceNo,
      returnDeadlineAt: record.order.returnDeadlineAt,
    },
  });
}
