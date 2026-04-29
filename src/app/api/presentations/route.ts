import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  ALLOWED_PRESENTATION_MIME_TYPES,
  MAX_PRESENTATION_BYTES,
  PRESENTATIONS_DIR_REL,
  PRESENTATIONS_PUBLIC_PATH,
  safePresentationExtensionFor,
} from "@/lib/presentations";
import { isValidLessonId, lessonIdToModuleId } from "@/lib/videos";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const presentations = await db.lessonPresentation.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ presentations });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json(
      { error: "Требуется вход администратора" },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart/form-data body" },
      { status: 400 },
    );
  }

  const lessonId = String(formData.get("lessonId") ?? "").trim();
  const file = formData.get("file");

  if (!isValidLessonId(lessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_PRESENTATION_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_PRESENTATION_BYTES} bytes)` },
      { status: 413 },
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_PRESENTATION_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported MIME type: ${mimeType}` },
      { status: 415 },
    );
  }

  const ext = safePresentationExtensionFor(mimeType, file.name);
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file extension" },
      { status: 415 },
    );
  }

  const moduleId = lessonIdToModuleId(lessonId)!;
  const dirAbs = path.join(process.cwd(), PRESENTATIONS_DIR_REL);
  await mkdir(dirAbs, { recursive: true });

  const filename = `${lessonId}${ext}`;
  const fileAbs = path.join(dirAbs, filename);

  // Remove any previous file with a different extension for this lesson.
  const prev = await db.lessonPresentation.findUnique({ where: { lessonId } });
  if (prev) {
    const prevAbs = path.join(
      process.cwd(),
      "public",
      prev.url.replace(/^\//, "").split("?")[0],
    );
    if (prevAbs !== fileAbs) {
      try {
        await unlink(prevAbs);
      } catch {
        // ignore missing file
      }
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fileAbs, buffer);

  // Append a cache-busting query param so the browser fetches the new file.
  const url = `${PRESENTATIONS_PUBLIC_PATH}/${filename}?v=${Date.now()}`;

  const saved = await db.lessonPresentation.upsert({
    where: { lessonId },
    create: {
      lessonId,
      moduleId,
      url,
      originalName: file.name || filename,
      mimeType,
      sizeBytes: file.size,
    },
    update: {
      moduleId,
      url,
      originalName: file.name || filename,
      mimeType,
      sizeBytes: file.size,
    },
  });

  return NextResponse.json({ presentation: saved }, { status: 201 });
}
