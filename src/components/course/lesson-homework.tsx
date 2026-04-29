"use client";

import { useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  Upload,
  Trash2,
  AlertCircle,
  Download,
  ExternalLink,
  Loader2,
  MessageSquare,
  Pencil,
  Save,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useHomeworkStore,
  type HomeworkSubmissionDto,
} from "@/store/homework-store";
import { useAuthStore } from "@/store/auth-store";

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_FEEDBACK_LENGTH = 4000;
const ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
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
].join(",");

const STUDENT_NAME_KEY = "vacuum-homework-student-name";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface LessonHomeworkProps {
  lessonId: string;
}

export function LessonHomeworkBlock({ lessonId }: LessonHomeworkProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const allSubmissions = useHomeworkStore((s) => s.submissions);
  const submissions = useMemo(
    () => allSubmissions.filter((s) => s.lessonId === lessonId),
    [allSubmissions, lessonId],
  );
  const addSubmission = useHomeworkStore((s) => s.addSubmission);
  const updateSubmission = useHomeworkStore((s) => s.updateSubmission);
  const removeSubmission = useHomeworkStore((s) => s.removeSubmission);
  const admin = useAuthStore((s) => s.admin);

  const [studentName, setStudentName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(STUDENT_NAME_KEY) || "";
  });
  const [pendingFileName, setPendingFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const persistName = (name: string) => {
    setStudentName(name);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STUDENT_NAME_KEY, name);
    }
  };

  const handleSelectFile = () => {
    setError(null);
    if (!studentName.trim()) {
      setError("Сначала укажите имя автора работы.");
      return;
    }
    inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);

    if (!studentName.trim()) {
      setError("Сначала укажите имя автора работы.");
      return;
    }
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
    form.append("studentName", studentName.trim());
    form.append("file", file);

    setPendingFileName(file.name);
    setUploading(true);
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
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
            submission: HomeworkSubmissionDto;
          };
          addSubmission(data.submission);
          setProgress(100);
          setPendingFileName(null);
          if (inputRef.current) inputRef.current.value = "";
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
    xhr.open("POST", "/api/homework");
    xhr.send(form);
  };

  const handleCancel = () => {
    xhrRef.current?.abort();
  };

  return (
    <section className="mb-8" data-testid="lesson-homework-block">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList className="w-4 h-4 text-[#3538CD]" />
        <h3 className="text-base font-semibold text-[#3538CD]">
          Домашнее задание
        </h3>
        {submissions.length > 0 && (
          <span className="text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full">
            {submissions.length}
          </span>
        )}
      </div>

      {/* Submit form */}
      <div
        className="rounded-xl border border-[#E6E6E6] bg-[#FCFCFD] p-4 mb-4"
        data-testid="homework-submit-form"
      >
        <p className="text-xs text-[#475467] mb-3">
          Загрузите свою работу, чтобы получить рекомендации администратора. До{" "}
          {formatBytes(MAX_BYTES)}, форматы: pdf, doc, docx, txt, png, jpg, zip.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#909AA5]" />
            <input
              type="text"
              value={studentName}
              onChange={(e) => persistName(e.target.value)}
              placeholder="Ваше имя"
              maxLength={80}
              className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-[#E6E6E6] bg-white focus:outline-none focus:ring-2 focus:ring-[#3538CD]/40"
              data-testid="homework-student-name-input"
            />
          </div>
          <Button
            type="button"
            onClick={handleSelectFile}
            disabled={uploading}
            className="bg-[#3538CD] hover:bg-[#1C0694] text-white shrink-0"
            data-testid="homework-upload-button"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 mr-1.5" />
            )}
            {uploading ? "Загрузка…" : "Загрузить ДЗ"}
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading && (
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs text-[#909AA5] tabular-nums w-10 text-right">
              {progress}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-xs h-7 px-2"
            >
              Отмена
            </Button>
            {pendingFileName && (
              <span className="sr-only">{pendingFileName}</span>
            )}
          </div>
        )}

        {error && (
          <div
            className="mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2"
            data-testid="homework-error-banner"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Existing submissions list */}
      {submissions.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-[#E6E6E6] bg-white px-4 py-6 text-center"
          data-testid="homework-empty-state"
        >
          <p className="text-xs text-[#909AA5]">
            Пока нет загруженных работ. Будьте первым!
          </p>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="homework-submission-list">
          {submissions.map((s) => (
            <SubmissionCard
              key={s.id}
              submission={s}
              admin={admin}
              onUpdate={updateSubmission}
              onDelete={(id) => removeSubmission(id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface SubmissionCardProps {
  submission: HomeworkSubmissionDto;
  admin: boolean;
  onUpdate: (s: HomeworkSubmissionDto) => void;
  onDelete: (id: string) => void;
}

function SubmissionCard({
  submission,
  admin,
  onUpdate,
  onDelete,
}: SubmissionCardProps) {
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setFeedback(submission.feedback ?? "");
    setEditing(true);
    setError(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFeedback(submission.feedback ?? "");
    setError(null);
  };

  const saveFeedback = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/homework/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: feedback.trim() || null }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { submission: HomeworkSubmissionDto };
      onUpdate(data.submission);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Удалить работу «${submission.originalName}» от ${submission.studentName}?`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/homework/${submission.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      onDelete(submission.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li
      className="rounded-xl border border-[#E6E6E6] bg-white p-4"
      data-testid="homework-submission-card"
    >
      {/* Header: student name + date + admin actions */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p
            className="text-sm font-semibold text-[#1D2939] truncate"
            data-testid="homework-student-name"
          >
            {submission.studentName}
          </p>
          <p className="text-[11px] text-[#909AA5] mt-0.5">
            {formatDate(submission.createdAt)}
          </p>
        </div>
        {admin && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0 h-7 px-2"
            onClick={handleDelete}
            disabled={deleting || saving}
            data-testid="homework-delete-button"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {deleting ? "…" : "Удалить"}
          </Button>
        )}
      </div>

      {/* File row */}
      <div className="flex items-center gap-2 text-xs text-[#475467] bg-[#FCFCFD] border border-[#E6E6E6] rounded-md px-3 py-2 mb-3">
        <span
          className="font-medium text-[#1D2939] truncate flex-1"
          title={submission.originalName}
        >
          {submission.originalName}
        </span>
        <span className="text-[#909AA5] shrink-0">
          {formatBytes(submission.sizeBytes)}
        </span>
        <a
          href={submission.url}
          download={submission.originalName}
          className="inline-flex items-center gap-1 text-[#3538CD] hover:underline shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Скачать</span>
        </a>
        <a
          href={submission.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#475467] hover:text-[#3538CD] shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Feedback area */}
      <div
        className={cn(
          "rounded-md border px-3 py-2.5",
          submission.feedback && !editing
            ? "bg-[#3538CD]/5 border-[#3538CD]/20"
            : "bg-[#FCFCFD] border-[#E6E6E6]",
        )}
        data-testid="homework-feedback-area"
      >
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#3538CD]">
            <MessageSquare className="w-3.5 h-3.5" />
            Рекомендации администратора
          </div>
          {admin && !editing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={startEdit}
              data-testid="homework-feedback-edit-button"
            >
              <Pencil className="w-3 h-3 mr-1" />
              {submission.feedback ? "Изменить" : "Написать"}
            </Button>
          )}
        </div>

        {editing ? (
          <div>
            <textarea
              value={feedback}
              onChange={(e) =>
                setFeedback(e.target.value.slice(0, MAX_FEEDBACK_LENGTH))
              }
              rows={4}
              placeholder="Напишите рекомендации для автора работы…"
              className="w-full text-sm rounded-md border border-[#E6E6E6] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3538CD]/40 resize-y min-h-[88px]"
              data-testid="homework-feedback-textarea"
            />
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-[10px] text-[#909AA5]">
                {feedback.length}/{MAX_FEEDBACK_LENGTH}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X className="w-3 h-3 mr-1" />
                  Отмена
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#3538CD] hover:bg-[#1C0694] text-white h-7 px-2 text-xs"
                  onClick={saveFeedback}
                  disabled={saving}
                  data-testid="homework-feedback-save-button"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        ) : submission.feedback ? (
          <p
            className="text-sm text-[#1D2939] whitespace-pre-line leading-relaxed"
            data-testid="homework-feedback-text"
          >
            {submission.feedback}
          </p>
        ) : (
          <p
            className="text-xs text-[#909AA5] italic"
            data-testid="homework-feedback-empty"
          >
            {admin
              ? "Рекомендаций пока нет — нажмите «Написать», чтобы оставить отзыв."
              : "Администратор ещё не оставил рекомендации."}
          </p>
        )}

        {error && (
          <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </li>
  );
}
