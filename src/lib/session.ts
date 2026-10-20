import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7;

const jwtSecret = process.env.JWT_SECRET;

function getSecret() {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET manquant");
  }

  return new TextEncoder().encode(jwtSecret);
}

export interface SessionPayload {
  userId: string;
  isAdmin?: boolean;
}

export async function createSession(userId: string, isAdmin: boolean = false) {
  const token = await new SignJWT({ userId, isAdmin })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      isAdmin: Boolean(payload.isAdmin),
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) return null;
  const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
  return admin;
}
