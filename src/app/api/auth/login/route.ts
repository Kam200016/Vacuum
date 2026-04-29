import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  createSessionToken,
  getAdminPassword,
  getAdminUsername,
  safeStringEquals,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof (body as { username?: unknown })?.username === "string"
      ? ((body as { username: string }).username || "").trim()
      : "";
  const password =
    typeof (body as { password?: unknown })?.password === "string"
      ? (body as { password: string }).password
      : "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Введите логин и пароль" },
      { status: 400 },
    );
  }

  const expectedUser = getAdminUsername();
  const expectedPass = getAdminPassword();

  const userOk = safeStringEquals(username, expectedUser);
  const passOk = safeStringEquals(password, expectedPass);

  if (!userOk || !passOk) {
    return NextResponse.json(
      { error: "Неверный логин или пароль" },
      { status: 401 },
    );
  }

  const token = createSessionToken();
  const res = NextResponse.json({ admin: true, username });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
