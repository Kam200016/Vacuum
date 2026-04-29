import { NextResponse } from "next/server";
import { getAdminUsername, isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await isAdminRequest();
  return NextResponse.json({
    admin,
    username: admin ? getAdminUsername() : null,
  });
}
