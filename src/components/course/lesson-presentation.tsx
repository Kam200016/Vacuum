"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Upload,
  Trash2,
  FileText,
  AlertCircle,
  Loader2,
  Lock,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  usePresentationsStore,
  type LessonPresentationDto,
} from "@/store/presentations-store";
import { useAuthStore } from "@/store/auth-store";

const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.apple.keynote",
  "application/vnd.oasis.opendocument.presentation",
].join(",");

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function isPdf(mimeType: string, url: string): boolean {
  if (mimeType === "application/pdf") return true;
  return url.split("?")[0].toLowerCase().endsWith(".pdf");
}

interface LessonPresentationProps {
  lessonId: string;
  presentation: LessonPresentationDto | undefined;
}

export function LessonPresentationBlock({
  lessonId,
  presentation,
}: LessonPresentationProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const setPresentation = usePresentationsStore((s) => s.setPresentation);
  const removePresentation = usePresentationsStore((s) => s.removePresentation);
  const admin = useAuthStore((s) => s.admin);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setError(null);
    if (file.size > MAX_BYTES) {
      setError(`Файл слишком большой (макс ${formatBytes(MAX_BYTES)}).`);
      return;
    }
    if (file.type && !ACCEPT.split(",").includes(file.type)) {
      setError(`Неподдерживаемый формат: ${file.type || "неизвестен"}.`);
      return;
    }

    const form = new FormData();
    form.append("lessonId", lessonId);
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    setUploading(true);
    setProgress(0);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError("Ошибка сети при загрузке.");
    };
    xhr.onabort = () => {
      setUploading(false);
      setProgress(0);
    };
    xhr.onload = () => {
      setUploading(false);
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as {
            presentation: LessonPresentationDto;
          };
          setPresentation(data.presentation);
          setProgress(100);
        } catch {
          setError("Не удалось распарсить ответ сервера.");
        }
      } else {
        let msg = `Ошибка ${xhr.status}`;
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string };
          if (data.error) msg = data.error;
        } catch {
          // ignore
        }
        setError(msg);
      }
    };
    xhr.open("POST", "/api/presentations");
    xhr.send(form);
  };

  const handleCancel = () => {
    xhrRef.current?.abort();
  };

  const handleDelete = async () => {
    if (!presentation) return;
    if (!window.confirm("Удалить презентацию?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/presentations/${lessonId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      removePresentation(lessonId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-[#3538CD]" />
        <h3 className="text-base font-semibold text-[#3538CD]">Презентация</h3>
      </div>

      {presentation ? (
        <div className="rounded-xl overflow-hidden border border-[#E6E6E6] bg-white">
          {isPdf(presentation.mimeType, presentation.url) ? (
            <iframe
              key={presentation.url}
              src={presentation.url}
              title={presentation.originalName}
              className="w-full h-[480px] bg-[#F5F5F7]"
              data-testid="presentation-iframe"
            />
          ) : (
            <div
              className="w-full h-[180px] bg-[#FCFCFD] flex flex-col items-center justify-center text-center px-4 border-b border-[#E6E6E6]"
              data-testid="presentation-download-card"
            >
              <FileText className="w-8 h-8 text-[#3538CD] mb-2" />
              <p className="text-sm font-medium text-[#1D2939]">
                {presentation.originalName}
              </p>
              <p className="text-xs text-[#909AA5] mt-1 mb-3">
                Предпросмотр недоступен — скачайте файл, чтобы открыть.
              </p>
              <a
                href={presentation.url}
                target="_blank"
                rel="noopener noreferrer"
                download={presentation.originalName}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3538CD] hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                Скачать
              </a>
            </div>
          )}
          <div className="bg-[#FCFCFD] px-4 py-2.5 border-t border-[#E6E6E6] flex items-center justify-between gap-3">
            <div className="min-w-0 text-xs text-[#475467] truncate">
              <span className="font-medium text-[#1D2939]">
                {presentation.originalName}
              </span>
              <span className="ml-2 text-[#909AA5]">
                {formatBytes(presentation.sizeBytes)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={presentation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#475467] hover:text-[#3538CD]"
                title="Открыть в новой вкладке"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Открыть</span>
              </a>
              {admin && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#475467]"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading || deleting}
                    data-testid="presentation-replace-button"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Заменить
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={uploading || deleting}
                    data-testid="presentation-delete-button"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    {deleting ? "Удаление…" : "Удалить"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : admin ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid="presentation-upload-dropzone"
          className={cn(
            "w-full rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
            "flex flex-col items-center justify-center text-center",
            uploading
              ? "border-[#3538CD]/40 bg-[#3538CD]/5 cursor-progress"
              : "border-[#E6E6E6] hover:border-[#3538CD]/40 hover:bg-[#FCFCFD] cursor-pointer",
          )}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#3538CD] mb-2 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-[#909AA5] mb-2" />
          )}
          <p className="text-sm font-medium text-[#1D2939]">
            {uploading ? "Загрузка презентации…" : "Загрузить презентацию"}
          </p>
          <p className="text-xs text-[#909AA5] mt-1">
            pdf / pptx / ppt / key / odp, до {formatBytes(MAX_BYTES)}
          </p>
        </button>
      ) : (
        <div
          className="w-full rounded-xl border border-dashed border-[#E6E6E6] bg-[#FCFCFD] px-6 py-8 flex flex-col items-center justify-center text-center"
          data-testid="presentation-locked-placeholder"
        >
          <Lock className="w-5 h-5 text-[#909AA5] mb-2" />
          <p className="text-sm font-medium text-[#1D2939]">
            Презентация ещё не загружена
          </p>
          <p className="text-xs text-[#909AA5] mt-1">
            Загрузка доступна администратору.{" "}
            <Link
              href="/admin/login"
              className="text-[#3538CD] hover:underline"
            >
              Войти
            </Link>
          </p>
        </div>
      )}

      {uploading && (
        <div className="mt-3 flex items-center gap-3">
          <Progress value={progress} className="flex-1 h-2" />
          <span className="text-xs text-[#475467] tabular-nums w-10 text-right">
            {progress}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[#737373]"
            onClick={handleCancel}
          >
            Отмена
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </section>
  );
}
