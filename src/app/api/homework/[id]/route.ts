import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/auth";
import { MAX_FEEDBACK_LENGTH } from "@/lib/homework";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only: edit feedback (recommendations) on a submission.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json(
      { error: "Требуется вход администратора" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const existing = await db.homeworkSubmission.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Ожидается JSON-объект" },
      { status: 400 },
    );
  }
  const data = body as { feedback?: unknown };
  if (typeof data.feedback !== "string" && data.feedback !== null) {
    return NextResponse.json(
      { error: "Ожидается поле feedback (строка)" },
      { status: 400 },
    );
  }

  const trimmed =
    typeof data.feedback === "string"
      ? data.feedback.slice(0, MAX_FEEDBACK_LENGTH)
      : null;

  const saved = await db.homeworkSubmission.update({
    where: { id },
    data: { feedback: trimmed && trimmed.trim().length > 0 ? trimmed : null },
  });
  return NextResponse.json({ submission: saved });
}

// Admin-only: delete a submission (file + DB row).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json(
      { error: "Требуется вход администратора" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const existing = await db.homeworkSubmission.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Strip cache-buster querystring before unlink.
  const relPath = existing.url.replace(/^\//, "").split("?")[0];
  if (relPath) {
    const fileAbs = path.join(process.cwd(), "public", relPath);
    try {
      await unlink(fileAbs);
    } catch {
      // ignore missing file
    }
  }

  await db.homeworkSubmission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
