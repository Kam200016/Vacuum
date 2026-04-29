import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "vacuum_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 h

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    "vacuum-admin-dev-secret-change-me-in-production"
  );
}

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || "Админ";
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin2";
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return base64url(createHmac("sha256", getSecret()).update(payload).digest());
}

export function createSessionToken(ttlSeconds: number = SESSION_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function safeStringEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  try {
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export async function isAdminRequest(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
