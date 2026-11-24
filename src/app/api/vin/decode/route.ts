import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { decodeVinLive } from "@/lib/vin";

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

  const decoded = await decodeVinLive(parsed.data.vin);
  if (!decoded.valid) {
    return NextResponse.json(decoded, { status: 400 });
  }

  let compatibleParts: unknown[] = [];
  const brandKeyword = decoded.brand?.trim().split(/[\s/]+/)[0];
  if (brandKeyword && brandKeyword !== "Diğer") {
    try {
      const matched = await prisma.catalogPart.findMany({
        where: {
          brand: { contains: brandKeyword, mode: "insensitive" },
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 8,
      });
      if (Array.isArray(matched)) {
        compatibleParts = matched;
      }
    } catch {
      compatibleParts = [];
    }
  }

  return NextResponse.json({ ...decoded, compatibleParts }, { status: 200 });
}
