import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { isValidLessonId } from "@/lib/videos";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ lessonId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { lessonId } = await params;
  if (!isValidLessonId(lessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
  }
  const presentation = await db.lessonPresentation.findUnique({
    where: { lessonId },
  });
  if (!presentation) {
    return NextResponse.json({ presentation: null }, { status: 404 });
  }
  return NextResponse.json({ presentation });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json(
      { error: "Требуется вход администратора" },
      { status: 401 },
    );
  }

  const { lessonId } = await params;
  if (!isValidLessonId(lessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
  }
  const presentation = await db.lessonPresentation.findUnique({
    where: { lessonId },
  });
  if (!presentation) {
    return NextResponse.json({ ok: true, deleted: false });
  }

  const fileAbs = path.join(
    process.cwd(),
    "public",
    presentation.url.replace(/^\//, "").split("?")[0],
  );
  try {
    await unlink(fileAbs);
  } catch {
    // ignore missing file
  }

  await db.lessonPresentation.delete({ where: { lessonId } });
  return NextResponse.json({ ok: true, deleted: true });
}
