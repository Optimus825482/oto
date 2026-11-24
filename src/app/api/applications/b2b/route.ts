import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings";

const b2bApplicationSchema = z.object({
  serviceName: z.string().trim().min(2, "Servis / işletme adı en az 2 karakter olmalıdır."),
  contactName: z.string().trim().min(2, "Yetkili ad soyad zorunludur."),
  phone: z.string().trim().min(10, "Geçerli bir telefon numarası giriniz."),
  email: z
    .string()
    .trim()
    .email("Geçerli bir e-posta adresi giriniz.")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().min(2, "Şehir bilgisi zorunludur."),
  taxNumber: z.string().trim().optional().or(z.literal("")),
  monthlyVolume: z.string().trim().optional().or(z.literal("")),
  specialtyBrands: z
    .array(z.string().trim())
    .optional()
    .default([])
    .transform((items) => items.filter(Boolean)),
});

export async function POST(req: Request) {
  const settings = await getSystemSettings();
  if (!settings.enableB2bDealers) {
    return NextResponse.json(
      { error: "B2B bayi başvuruları şu anda geçici olarak kapalıdır." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const parsed = b2bApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Başvuru bilgileri geçersiz." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const application = await prisma.b2BApplication.create({
    data: {
      serviceName: data.serviceName,
      contactName: data.contactName,
      phone: data.phone,
      email: data.email || null,
      city: data.city,
      taxNumber: data.taxNumber || null,
      monthlyVolume: data.monthlyVolume || null,
      specialtyBrands: data.specialtyBrands,
      status: "PENDING",
    },
    select: {
      id: true,
      serviceName: true,
      status: true,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}
