import path from "node:path";

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime", // .mov
]);

export const ALLOWED_VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".ogv",
  ".ogg",
  ".mov",
]);

export const VIDEOS_DIR_REL = path.join("public", "uploads", "videos");
export const VIDEOS_PUBLIC_PATH = "/uploads/videos";

const LESSON_ID_RE = /^\d+-\d+$/;

export function isValidLessonId(id: string): boolean {
  return LESSON_ID_RE.test(id);
}

export function lessonIdToModuleId(lessonId: string): string | null {
  if (!isValidLessonId(lessonId)) return null;
  const moduleNumber = lessonId.split("-")[0];
  return `module-${moduleNumber}`;
}

export function safeExtensionFor(mimeType: string, originalName: string): string | null {
  const lower = (originalName || "").toLowerCase();
  const ext = path.extname(lower);
  if (ALLOWED_VIDEO_EXTENSIONS.has(ext)) return ext;
  switch (mimeType) {
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "video/ogg":
      return ".ogv";
    case "video/quicktime":
      return ".mov";
    default:
      return null;
  }
}
