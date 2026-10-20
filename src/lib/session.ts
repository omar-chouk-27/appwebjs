import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type UserRole = "ADMIN" | "ENSEIGNANT" | "ETUDIANT";

export interface SessionPayload {
  userId: number;
  role?: UserRole;
}

const jwtSecret = process.env.JWT_SECRET;

function getSecret() {
  if (!jwtSecret) {
    throw new Error("JWT_SECRET manquant");
  }

  return new TextEncoder().encode(jwtSecret);
}

export async function createSession(userId: number, role?: UserRole) {
  const token = await new SignJWT({ userId, role: role ?? "ETUDIANT" })
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
      userId: payload.userId as number,
      role: (payload.role as UserRole) || "ETUDIANT",
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
