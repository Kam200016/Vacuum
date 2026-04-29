import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import {
  ALLOWED_HOMEWORK_MIME_TYPES,
  HOMEWORK_DIR_REL,
  HOMEWORK_PUBLIC_PATH,
  MAX_HOMEWORK_BYTES,
  safeHomeworkExtensionFor,
  sanitizeStudentName,
} from "@/lib/homework";
import { isValidLessonId, lessonIdToModuleId } from "@/lib/videos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lessonId = url.searchParams.get("lessonId");

  const where = lessonId ? { lessonId } : undefined;
  const submissions = await db.homeworkSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ submissions });
}

// Public endpoint: anyone can submit homework by providing a name + file.
// (Per-user authentication is planned separately; until then we identify
// submissions by the supplied student name.)
export async function POST(req: Request) {
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
  const studentNameRaw = String(formData.get("studentName") ?? "");
  const studentName = sanitizeStudentName(studentNameRaw);
  const file = formData.get("file");

  if (!isValidLessonId(lessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
  }
  if (!studentName) {
    return NextResponse.json(
      { error: "Укажите имя автора работы" },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_HOMEWORK_BYTES) {
    return NextResponse.json(
      { error: `Файл слишком большой (макс ${MAX_HOMEWORK_BYTES} байт)` },
      { status: 413 },
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_HOMEWORK_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `Неподдерживаемый формат: ${mimeType}` },
      { status: 415 },
    );
  }

  const ext = safeHomeworkExtensionFor(mimeType, file.name);
  if (!ext) {
    return NextResponse.json(
      { error: "Неподдерживаемое расширение файла" },
      { status: 415 },
    );
  }

  const moduleId = lessonIdToModuleId(lessonId)!;
  const dirAbs = path.join(process.cwd(), HOMEWORK_DIR_REL);
  await mkdir(dirAbs, { recursive: true });

  // We don't have the cuid until after we insert. Use a temporary approach:
  // create the row first with a placeholder URL, then write the file using
  // the row id as filename, then update the row with the final URL.
  const placeholder = await db.homeworkSubmission.create({
    data: {
      lessonId,
      moduleId,
      studentName,
      url: "",
      originalName: file.name || `homework${ext}`,
      mimeType,
      sizeBytes: file.size,
    },
  });

  const filename = `${placeholder.id}${ext}`;
  const fileAbs = path.join(dirAbs, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fileAbs, buffer);

  const finalUrl = `${HOMEWORK_PUBLIC_PATH}/${filename}?v=${Date.now()}`;
  const saved = await db.homeworkSubmission.update({
    where: { id: placeholder.id },
    data: { url: finalUrl },
  });

  return NextResponse.json({ submission: saved }, { status: 201 });
}
