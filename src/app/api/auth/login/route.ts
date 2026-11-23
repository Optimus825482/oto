import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(1, "Şifre alanı zorunludur."),
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Giriş bilgileri geçersiz." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: {
      supplierProfile: {
        select: {
          id: true,
          companyName: true,
          city: true,
          isApproved: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "E-posta adresi veya şifre hatalı." },
      { status: 401 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "Hesabınız devre dışı bırakılmıştır." },
      { status: 401 }
    );
  }

  const passwordValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash
  );
  if (!passwordValid) {
    return NextResponse.json(
      { error: "E-posta adresi veya şifre hatalı." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    supplierId: user.supplierProfile?.id ?? null,
  });

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      supplierId: user.supplierProfile?.id ?? null,
      supplierProfile: user.supplierProfile ?? null,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
