import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizePartCode } from "@/lib/vin";

const testLabSchema = z.object({
  serialNo: z.string().min(1, "Seri numarası zorunludur."),
  hologramSealCode: z.string().min(1, "Hologram mühür kodu zorunludur."),
  physicalCheckOk: z.boolean(),
  pinCheckOk: z.boolean(),
  canObdCheckOk: z.boolean(),
  result: z.enum(["PASS", "FAIL"]),
  notes: z.string().optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "OPERATOR", "TECHNICIAN"]);
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

  const parsed = testLabSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz test lab verisi.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      inquiry: true,
      supplier: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const isPass = parsed.data.result === "PASS";
  const certificateCode = isPass ? `CERT-${order.inquiry.code}` : null;
  const orderStatus = isPass ? "TEST_PASSED" : "TEST_FAILED";

  const testRecord = await prisma.testLabRecord.upsert({
    where: { orderId: order.id },
    update: {
      technicianId: auth.user.userId,
      serialNo: parsed.data.serialNo,
      hologramSealCode: parsed.data.hologramSealCode,
      physicalCheckOk: parsed.data.physicalCheckOk,
      pinCheckOk: parsed.data.pinCheckOk,
      canObdCheckOk: parsed.data.canObdCheckOk,
      result: parsed.data.result,
      notes: parsed.data.notes ?? null,
      certificateCode,
      testedAt: new Date(),
    },
    create: {
      orderId: order.id,
      technicianId: auth.user.userId,
      serialNo: parsed.data.serialNo,
      hologramSealCode: parsed.data.hologramSealCode,
      physicalCheckOk: parsed.data.physicalCheckOk,
      pinCheckOk: parsed.data.pinCheckOk,
      canObdCheckOk: parsed.data.canObdCheckOk,
      result: parsed.data.result,
      notes: parsed.data.notes ?? null,
      certificateCode,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: orderStatus },
  });

  await prisma.inquiry.update({
    where: { id: order.inquiryId },
    data: { status: orderStatus },
  });

  let autoLearnedPart = false;

  if (isPass) {
    await prisma.supplierLedgerEntry.create({
      data: {
        supplierId: order.supplierId,
        orderId: order.id,
        type: "CREDIT_EARNED",
        amount: order.purchasePrice,
        description: `${order.orderNo} Test Onaylı Hakediş`,
        status: "PENDING",
      },
    });

    await prisma.supplierProfile.update({
      where: { id: order.supplierId },
      data: {
        balance: { increment: order.purchasePrice },
        totalDelivered: { increment: 1 },
      },
    });

    if (order.inquiry?.partCode) {
      const normalizedCode = normalizePartCode(order.inquiry.partCode);
      if (normalizedCode) {
        try {
          const existingPart = await prisma.catalogPart?.findFirst({
            where: { normalizedCode },
          });

          if (!existingPart) {
            await prisma.catalogPart?.create({
              data: {
                oemCode: order.inquiry.partCode,
                normalizedCode,
                crossRefCodes: [normalizedCode],
                category: order.inquiry.category,
                brand: order.inquiry.brand || "Diğer",
                model: "Test Onaylı Tedarik Arşivi",
                manufacturer: "OEM / Test Onaylı",
                referencePrice: order.customerPrice,
                isFeatured: false,
              },
            });
            autoLearnedPart = true;
          }
        } catch {
          autoLearnedPart = false;
        }
      }
    }
  } else {
    const nextRating = Math.max(
      1,
      Number((order.supplier.rating - 0.2).toFixed(1))
    );

    await prisma.supplierProfile.update({
      where: { id: order.supplierId },
      data: {
        defectCount: { increment: 1 },
        rating: nextRating,
      },
    });
  }

  return NextResponse.json({ testRecord, orderStatus, autoLearnedPart });
}
