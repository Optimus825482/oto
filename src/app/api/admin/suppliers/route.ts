import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const patchSupplierSchema = z.object({
  supplierId: z.string().min(1, "Tedarikçi ID zorunludur."),
  isApproved: z.boolean(),
});

export async function GET() {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const suppliers = await prisma.supplierProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
          phone: true,
        },
      },
      _count: {
        select: {
          orders: true,
          offers: true,
        },
      },
    },
  });

  return NextResponse.json({ suppliers });
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = patchSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz tedarikçi güncelleme verisi.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.supplierProfile.findUnique({
    where: { id: parsed.data.supplierId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Tedarikçi bulunamadı." }, { status: 404 });
  }

  const supplier = await prisma.supplierProfile.update({
    where: { id: parsed.data.supplierId },
    data: { isApproved: parsed.data.isApproved },
  });

  return NextResponse.json({ supplier });
}
