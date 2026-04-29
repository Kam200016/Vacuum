import path from "node:path";

export const MAX_HOMEWORK_BYTES = 50 * 1024 * 1024; // 50 MB

// Broad set of file types that students typically submit.
export const ALLOWED_HOMEWORK_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.oasis.opendocument.text", // .odt
  "application/rtf",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
]);

export const ALLOWED_HOMEWORK_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".odt",
  ".rtf",
  ".txt",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".heic",
  ".zip",
  ".rar",
  ".7z",
]);

export const HOMEWORK_DIR_REL = path.join("public", "uploads", "homework");
export const HOMEWORK_PUBLIC_PATH = "/uploads/homework";

export const MAX_STUDENT_NAME_LENGTH = 80;
export const MAX_FEEDBACK_LENGTH = 4000;

export function safeHomeworkExtensionFor(
  mimeType: string,
  originalName: string,
): string | null {
  const lower = (originalName || "").toLowerCase();
  const ext = path.extname(lower);
  if (ALLOWED_HOMEWORK_EXTENSIONS.has(ext)) return ext;
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "application/msword":
      return ".doc";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return ".docx";
    case "application/vnd.oasis.opendocument.text":
      return ".odt";
    case "application/rtf":
      return ".rtf";
    case "text/plain":
      return ".txt";
    case "text/csv":
      return ".csv";
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/heic":
      return ".heic";
    case "application/zip":
    case "application/x-zip-compressed":
      return ".zip";
    case "application/x-rar-compressed":
    case "application/vnd.rar":
      return ".rar";
    case "application/x-7z-compressed":
      return ".7z";
    default:
      return null;
  }
}

export function sanitizeStudentName(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, MAX_STUDENT_NAME_LENGTH);
}
