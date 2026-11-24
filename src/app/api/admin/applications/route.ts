import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const patchApplicationSchema = z.object({
  type: z.enum(["supplier", "b2b"]),
  id: z.string().min(1, "Başvuru ID zorunludur."),
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
});

export async function GET() {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [supplierApplications, b2bApplications] = await Promise.all([
    prisma.supplierApplication.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.b2BApplication.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ supplierApplications, b2bApplications });
}

export async function PATCH(req: Request) {
  const auth = await requireRole(["ADMIN", "OPERATOR"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON gövdesi." }, { status: 400 });
  }

  const parsed = patchApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "Geçersiz başvuru güncelleme verisi.",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { type, id, status } = parsed.data;

  if (type === "supplier") {
    const existing = await prisma.supplierApplication.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tedarikçi başvurusu bulunamadı." }, { status: 404 });
    }
    await prisma.supplierApplication.update({
      where: { id },
      data: { status },
    });
  } else {
    const existing = await prisma.b2BApplication.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "B2B servis başvurusu bulunamadı." }, { status: 404 });
    }
    await prisma.b2BApplication.update({
      where: { id },
      data: { status },
    });
  }

  return NextResponse.json({ ok: true });
}
