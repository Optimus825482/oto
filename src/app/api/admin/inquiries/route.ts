import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      offers: {
        orderBy: { purchasePrice: "asc" },
        include: {
          supplier: {
            select: {
              id: true,
              companyName: true,
              city: true,
              rating: true,
              totalDelivered: true,
              defectCount: true,
            },
          },
        },
      },
      order: true,
    },
  });

  return NextResponse.json({ inquiries });
}
