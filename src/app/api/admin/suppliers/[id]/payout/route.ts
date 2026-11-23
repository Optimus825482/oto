import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const payoutSchema = z.object({
  amount: z.coerce.number().optional(),
  description: z.string().optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: unknown = {};
  try {
    const text = await req.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz ödeme verisi.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supplier = await prisma.supplierProfile.findUnique({
    where: { id },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Tedarikçi bulunamadı." }, { status: 404 });
  }

  const payAmount = parsed.data.amount ?? supplier.balance;
  if (payAmount <= 0 || payAmount > supplier.balance) {
    return NextResponse.json(
      {
        error:
          "Ödeme tutarı 0'dan büyük ve tedarikçinin mevcut bakiyesinden küçük veya eşit olmalıdır.",
      },
      { status: 400 }
    );
  }

  await prisma.supplierLedgerEntry.create({
    data: {
      supplierId: supplier.id,
      type: "PAYOUT_PAID",
      amount: -payAmount,
      description: parsed.data.description || "Tedarikçi Hakediş Ödemesi",
      status: "SETTLED",
    },
  });

  await prisma.supplierLedgerEntry.updateMany({
    where: {
      supplierId: supplier.id,
      type: "CREDIT_EARNED",
      status: "PENDING",
    },
    data: { status: "SETTLED" },
  });

  const updatedSupplier = await prisma.supplierProfile.update({
    where: { id: supplier.id },
    data: {
      balance: { decrement: payAmount },
    },
  });

  return NextResponse.json({
    paidAmount: payAmount,
    remainingBalance: updatedSupplier.balance,
  });
}
