import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { isValidLessonId } from "@/lib/videos";

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
  const video = await db.lessonVideo.findUnique({ where: { lessonId } });
  if (!video) {
    return NextResponse.json({ video: null }, { status: 404 });
  }
  return NextResponse.json({ video });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { lessonId } = await params;
  if (!isValidLessonId(lessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
  }
  const video = await db.lessonVideo.findUnique({ where: { lessonId } });
  if (!video) {
    return NextResponse.json({ ok: true, deleted: false });
  }

  const fileAbs = path.join(
    process.cwd(),
    "public",
    video.url.replace(/^\//, "").split("?")[0],
  );
  try {
    await unlink(fileAbs);
  } catch {
    // ignore missing file
  }

  await db.lessonVideo.delete({ where: { lessonId } });
  return NextResponse.json({ ok: true, deleted: true });
}
