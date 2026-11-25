import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSystemSettings();
  return NextResponse.json({ settings });
}
