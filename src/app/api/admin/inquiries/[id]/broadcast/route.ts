import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  const inquiry = await prisma.inquiry.findUnique({ where: { id } });
  if (!inquiry) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 });
  }

  const approvedSuppliers = await prisma.supplierProfile.findMany({
    where: { isApproved: true },
  });

  const brandLower = inquiry.brand?.trim().toLowerCase();
  const brandMatched = brandLower
    ? approvedSuppliers.filter((s) =>
        s.specialtyBrands.some(
          (b) =>
            b.toLowerCase().includes(brandLower) ||
            brandLower.includes(b.toLowerCase())
        )
      )
    : [];

  const targetSuppliers =
    brandMatched.length > 0 ? brandMatched : approvedSuppliers;

  const updatedInquiry = await prisma.inquiry.update({
    where: { id },
    data: {
      status: "BROADCASTED",
      broadcastedAt: new Date(),
    },
  });

  const partLabel = inquiry.partCode || inquiry.category;
  const brandLabel = inquiry.brand || "Belirtilmemiş";

  await sendNotification({
    channel: "WHATSAPP",
    recipient: `${targetSuppliers.length} Onaylı Tedarikçi`,
    template: "RFQ_BROADCAST",
    message: `Yeni Talep ${inquiry.code}: ${brandLabel} ${partLabel}. Elinizde varsa hemen fiyat verin.`,
    relatedInquiryId: inquiry.id,
  });

  return NextResponse.json({
    inquiry: updatedInquiry,
    notifiedSupplierCount: targetSuppliers.length,
  });
}
