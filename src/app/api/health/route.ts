import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "connected" }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true, db: "disconnected" }, { status: 200 });
  }
}
