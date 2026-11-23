import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@prisma/client";
import { prisma } from "./db";

export const SESSION_COOKIE_NAME = "obp_session";

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  supplierId?: string | null;
}

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.JWT_SECRET ||
    "otobeyinpazari-local-dev-secret-key-2026-change-in-prod";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      fullName: typeof payload.fullName === "string" ? payload.fullName : "",
      role: payload.role as UserRole,
      supplierId:
        typeof payload.supplierId === "string" ? payload.supplierId : null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ user: SessionPayload } | { error: string; status: 401 | 403 }> {
  const user = await getSessionUser();
  if (!user) {
    return { error: "Oturum açmanız gerekiyor.", status: 401 };
  }
  if (!allowedRoles.includes(user.role)) {
    return { error: "Bu işlem için yetkiniz bulunmuyor.", status: 403 };
  }

  // Ensure supplierId is hydrated if user is a supplier
  if (user.role === "SUPPLIER" && !user.supplierId) {
    const profile = await prisma.supplierProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    if (profile) {
      user.supplierId = profile.id;
    }
  }

  return { user };
}
