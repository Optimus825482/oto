import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireRole(["ADMIN", "OPERATOR", "TECHNICIAN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [
    totalInquiries,
    newInquiries,
    awaitingQuotes,
    activeOrders,
    inTestLab,
    passedTests,
    revenueAgg,
    recentNotifications,
  ] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.count({
      where: { status: { in: ["BROADCASTED", "QUOTES_RECEIVED"] } },
    }),
    prisma.order.count({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] } },
    }),
    prisma.order.count({ where: { status: "IN_TEST_LAB" } }),
    prisma.testLabRecord.count({ where: { result: "PASS" } }),
    prisma.order.aggregate({
      _sum: {
        customerPrice: true,
        netProfit: true,
      },
    }),
    prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({
    kpis: {
      totalInquiries,
      newInquiries,
      awaitingQuotes,
      activeOrders,
      inTestLab,
      passedTests,
      totalRevenue: revenueAgg._sum.customerPrice ?? 0,
      totalNetProfit: revenueAgg._sum.netProfit ?? 0,
    },
    recentNotifications,
  });
}
