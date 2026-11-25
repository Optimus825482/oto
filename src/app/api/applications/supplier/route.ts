import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const supplierApplicationSchema = z.object({
  companyName: z.string().trim().min(2, "Firma ünvanı en az 2 karakter olmalıdır."),
  contactName: z.string().trim().min(2, "Yetkili ad soyad zorunludur."),
  phone: z.string().trim().min(10, "Geçerli bir telefon numarası giriniz."),
  email: z
    .string()
    .trim()
    .email("Geçerli bir e-posta adresi giriniz.")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().min(2, "Şehir bilgisi zorunludur."),
  district: z.string().trim().optional().or(z.literal("")),
  specialtyBrands: z
    .array(z.string().trim())
    .default([])
    .transform((items) => items.filter(Boolean)),
  monthlyStock: z.string().trim().optional().or(z.literal("")),
  note: z.string().trim().optional().or(z.literal("")),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const parsed = supplierApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Başvuru bilgileri geçersiz." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const application = await prisma.supplierApplication.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName,
      phone: data.phone,
      email: data.email || null,
      city: data.city,
      district: data.district || null,
      specialtyBrands: data.specialtyBrands,
      monthlyStock: data.monthlyStock || null,
      note: data.note || null,
      status: "PENDING",
    },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      city: true,
      status: true,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}
