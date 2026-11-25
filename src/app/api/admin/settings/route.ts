import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const updateSettingsSchema = z.object({
  enableCoreExchange: z.boolean(),
  coreDepositAmount: z.number().finite().min(0, "Depozito tutarı negatif olamaz.").max(100000),
  enableVinProgramming: z.boolean(),
  vinProgrammingFee: z.number().finite().min(0, "Programlama ücreti negatif olamaz.").max(100000),
  enableB2bDealers: z.boolean(),
  b2bDiscountPercent: z.number().finite().min(0, "İskonto oranı 0 ile 100 arasında olmalıdır.").max(100, "İskonto oranı %100'ü geçemez."),
});

export async function GET() {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await getSystemSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["ADMIN"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Geçersiz ayar verisi.",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const saved = await prisma.systemSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      enableCoreExchange: data.enableCoreExchange,
      coreDepositAmount: data.coreDepositAmount,
      enableVinProgramming: data.enableVinProgramming,
      vinProgrammingFee: data.vinProgrammingFee,
      enableB2bDealers: data.enableB2bDealers,
      b2bDiscountPercent: data.b2bDiscountPercent,
    },
    update: {
      enableCoreExchange: data.enableCoreExchange,
      coreDepositAmount: data.coreDepositAmount,
      enableVinProgramming: data.enableVinProgramming,
      vinProgrammingFee: data.vinProgrammingFee,
      enableB2bDealers: data.enableB2bDealers,
      b2bDiscountPercent: data.b2bDiscountPercent,
    },
  });

  return NextResponse.json({
    settings: {
      enableCoreExchange: saved.enableCoreExchange,
      coreDepositAmount: saved.coreDepositAmount,
      enableVinProgramming: saved.enableVinProgramming,
      vinProgrammingFee: saved.vinProgrammingFee,
      enableB2bDealers: saved.enableB2bDealers,
      b2bDiscountPercent: saved.b2bDiscountPercent,
    },
  });
}
