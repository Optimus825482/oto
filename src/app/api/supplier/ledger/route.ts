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

  const profileRow = await prisma.supplierProfile.findUnique({
    where: { id: supplierId },
    select: {
      companyName: true,
      city: true,
      district: true,
      rating: true,
      totalDelivered: true,
      defectCount: true,
      balance: true,
      specialtyBrands: true,
      isApproved: true,
    },
  });

  if (!profileRow) {
    return NextResponse.json(
      { error: "Tedarikçi profili bulunamadı." },
      { status: 404 }
    );
  }

  const entryRows = await prisma.supplierLedgerEntry.findMany({
    where: { supplierId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderId: true,
      type: true,
      amount: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });

  const profile = {
    companyName: profileRow.companyName,
    city: profileRow.city,
    district: profileRow.district ?? null,
    rating: profileRow.rating,
    totalDelivered: profileRow.totalDelivered,
    defectCount: profileRow.defectCount,
    balance: profileRow.balance,
    specialtyBrands: profileRow.specialtyBrands,
    isApproved: profileRow.isApproved,
  };

  const entries = entryRows.map((entry) => ({
    id: entry.id,
    orderId: entry.orderId ?? null,
    type: entry.type,
    amount: entry.amount,
    description: entry.description,
    status: entry.status,
    createdAt: entry.createdAt,
  }));

  return NextResponse.json({ profile, entries });
}
