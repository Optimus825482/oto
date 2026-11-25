import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { issueEInvoice } from "@/lib/adapters/einvoice";

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
  });

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const invoice = issueEInvoice({
    orderNo: order.orderNo,
    totalAmount: order.customerPrice,
    invoiceType: order.invoiceType,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { invoiceNo: invoice.invoiceNo },
  });

  return NextResponse.json({ invoice });
}
