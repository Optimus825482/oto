import { NextResponse } from "next/server";
import { z } from "zod";
import { decodeVin } from "@/lib/vin";

const vinSchema = z.object({
  vin: z.string().trim().min(1, "Şase numarası (VIN) alanı zorunludur."),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { valid: false, error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const parsed = vinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        valid: false,
        error: parsed.error.issues[0]?.message || "Şase numarası (VIN) geçersiz.",
      },
      { status: 400 }
    );
  }

  const decoded = decodeVin(parsed.data.vin);
  if (!decoded.valid) {
    return NextResponse.json(decoded, { status: 400 });
  }

  return NextResponse.json(decoded, { status: 200 });
}
