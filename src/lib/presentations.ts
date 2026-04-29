import path from "node:path";

export const MAX_PRESENTATION_BYTES = 100 * 1024 * 1024; // 100 MB

export const ALLOWED_PRESENTATION_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "application/vnd.apple.keynote", // .key
  "application/vnd.oasis.opendocument.presentation", // .odp
]);

export const ALLOWED_PRESENTATION_EXTENSIONS = new Set([
  ".pdf",
  ".ppt",
  ".pptx",
  ".key",
  ".odp",
]);

export const PRESENTATIONS_DIR_REL = path.join(
  "public",
  "uploads",
  "presentations",
);
export const PRESENTATIONS_PUBLIC_PATH = "/uploads/presentations";

export function safePresentationExtensionFor(
  mimeType: string,
  originalName: string,
): string | null {
  const lower = (originalName || "").toLowerCase();
  const ext = path.extname(lower);
  if (ALLOWED_PRESENTATION_EXTENSIONS.has(ext)) return ext;
  switch (mimeType) {
    case "application/pdf":
      return ".pdf";
    case "application/vnd.ms-powerpoint":
      return ".ppt";
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return ".pptx";
    case "application/vnd.apple.keynote":
      return ".key";
    case "application/vnd.oasis.opendocument.presentation":
      return ".odp";
    default:
      return null;
  }
}
