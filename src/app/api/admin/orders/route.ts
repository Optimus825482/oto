import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireRole(["ADMIN", "OPERATOR", "TECHNICIAN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      inquiry: true,
      supplier: true,
      testLabRecord: true,
    },
  });

  return NextResponse.json({ orders });
}
