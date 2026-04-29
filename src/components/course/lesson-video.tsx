"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Video as VideoIcon,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useVideosStore, type LessonVideoDto } from "@/store/videos-store";
import { useAuthStore } from "@/store/auth-store";

const MAX_BYTES = 500 * 1024 * 1024;
const ACCEPT = "video/mp4,video/webm,video/ogg,video/quicktime";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

interface LessonVideoProps {
  lessonId: string;
  video: LessonVideoDto | undefined;
}

export function LessonVideoBlock({ lessonId, video }: LessonVideoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const setVideo = useVideosStore((s) => s.setVideo);
  const removeVideo = useVideosStore((s) => s.removeVideo);
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
          const data = JSON.parse(xhr.responseText) as { video: LessonVideoDto };
          setVideo(data.video);
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
    xhr.open("POST", "/api/videos");
    xhr.send(form);
  };

  const handleCancel = () => {
    xhrRef.current?.abort();
  };

  const handleDelete = async () => {
    if (!video) return;
    if (!window.confirm("Удалить видеоурок?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos/${lessonId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      removeVideo(lessonId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <VideoIcon className="w-4 h-4 text-[#3538CD]" />
        <h3 className="text-base font-semibold text-[#3538CD]">Видео-урок</h3>
      </div>

      {video ? (
        <div className="rounded-xl overflow-hidden border border-[#E6E6E6] bg-black">
          <video
            key={video.url}
            src={video.url}
            controls
            preload="metadata"
            className="w-full max-h-[420px] bg-black"
          />
          <div className="bg-[#FCFCFD] px-4 py-2.5 border-t border-[#E6E6E6] flex items-center justify-between gap-3">
            <div className="min-w-0 text-xs text-[#475467] truncate">
              <span className="font-medium text-[#1D2939]">{video.originalName}</span>
              <span className="ml-2 text-[#909AA5]">
                {formatBytes(video.sizeBytes)}
              </span>
            </div>
            {admin && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-[#475467]"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading || deleting}
                  data-testid="video-replace-button"
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
                  data-testid="video-delete-button"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {deleting ? "Удаление…" : "Удалить"}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : admin ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          data-testid="video-upload-dropzone"
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
            {uploading ? "Загрузка видео…" : "Загрузить видеоурок"}
          </p>
          <p className="text-xs text-[#909AA5] mt-1">
            mp4 / webm / mov, до {formatBytes(MAX_BYTES)}
          </p>
        </button>
      ) : (
        <div
          className="w-full rounded-xl border border-dashed border-[#E6E6E6] bg-[#FCFCFD] px-6 py-8 flex flex-col items-center justify-center text-center"
          data-testid="video-locked-placeholder"
        >
          <Lock className="w-5 h-5 text-[#909AA5] mb-2" />
          <p className="text-sm font-medium text-[#1D2939]">
            Видео ещё не загружено
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
