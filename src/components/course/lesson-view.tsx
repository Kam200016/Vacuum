"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Lesson, Module } from "@/data/course-data";
import { LessonVideoBlock } from "@/components/course/lesson-video";
import { LessonPresentationBlock } from "@/components/course/lesson-presentation";
import { useVideosStore } from "@/store/videos-store";
import { usePresentationsStore } from "@/store/presentations-store";

// Local interface — will be replaced by the actual export from @/data/lecture-content
export interface LectureContent {
  title: string;
  sections: { heading: string; content: string }[];
}

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  content: LectureContent | undefined;
  isOpen: boolean;
  onClose: () => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
  prevLesson?: { lesson: Lesson; module: Module } | null;
  nextLesson?: { lesson: Lesson; module: Module } | null;
  onNavigate?: (lessonId: string, moduleId: string) => void;
  moduleProgress?: number;
}

const moduleColors = [
  { bg: "bg-[#3538CD]", light: "bg-[#3538CD]/8", text: "text-[#3538CD]" },
  { bg: "bg-[#1C0694]", light: "bg-[#1C0694]/8", text: "text-[#1C0694]" },
  { bg: "bg-[#7C3AED]", light: "bg-[#7C3AED]/8", text: "text-[#7C3AED]" },
  { bg: "bg-[#6366F1]", light: "bg-[#6366F1]/8", text: "text-[#6366F1]" },
  { bg: "bg-[#8B5CF6]", light: "bg-[#8B5CF6]/8", text: "text-[#8B5CF6]" },
  { bg: "bg-[#4F46E5]", light: "bg-[#4F46E5]/8", text: "text-[#4F46E5]" },
];

export function LessonView({
  lesson,
  module,
  content,
  isOpen,
  onClose,
  isCompleted,
  onToggleComplete,
  prevLesson,
  nextLesson,
  onNavigate,
  moduleProgress = 0,
}: LessonViewProps) {
  const color = moduleColors[(module.number - 1) % moduleColors.length];
  const video = useVideosStore((s) => s.videos[lesson.id]);
  const presentation = usePresentationsStore(
    (s) => s.presentations[lesson.id],
  );

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handlePrev = () => {
    if (prevLesson && onNavigate) {
      onNavigate(prevLesson.lesson.id, prevLesson.module.id);
    }
  };

  const handleNext = () => {
    if (nextLesson && onNavigate) {
      onNavigate(nextLesson.lesson.id, nextLesson.module.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 flex flex-col
                       w-full sm:w-[560px] lg:w-[640px]
                       bg-white border-l border-[#E6E6E6]
                       shadow-[-8px_0_24px_0_rgb(0_0_0/0.12)]"
            role="dialog"
            aria-modal="true"
            aria-label={`Урок: ${lesson.title}`}
          >
            {/* Module Progress Bar (thin strip at very top) */}
            <div className="h-1 bg-[#E6E6E6] shrink-0">
              <motion.div
                className={cn(
                  "h-full rounded-r-full",
                  moduleProgress === 100 ? "bg-green-500" : "bg-[#3538CD]"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${moduleProgress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>

            {/* Header */}
            <div className="shrink-0 px-4 sm:px-6 pt-4 pb-4">
              {/* Top row: close button + module badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold border-0",
                      color.light,
                      color.text
                    )}
                  >
                    Модуль {module.number}
                  </Badge>
                  <span className="text-xs text-[#909AA5] truncate">
                    {module.title}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-lg
                             hover:bg-[#F5F5F7] transition-colors shrink-0 ml-2"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4 text-[#737373]" />
                </button>
              </div>

              {/* Lesson title */}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    color.bg
                  )}
                >
                  {lesson.isPractice ? (
                    <FileText className="w-5 h-5 text-white" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={cn("text-xs font-semibold mb-0.5", color.text)}>
                    Урок {lesson.number}
                    {lesson.isPractice && (
                      <span className="ml-1.5 text-[10px] font-bold text-white bg-[#3538CD] px-1.5 py-0.5 rounded-full">
                        Практика
                      </span>
                    )}
                  </p>
                  <h2 className="text-lg font-semibold text-[#1D2939] leading-snug">
                    {lesson.title}
                  </h2>
                </div>
              </div>
            </div>

            <Separator className="bg-[#E6E6E6]" />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 custom-scrollbar">
              <LessonVideoBlock lessonId={lesson.id} video={video} />

              <LessonPresentationBlock
                lessonId={lesson.id}
                presentation={presentation}
              />

              {content ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="space-y-8"
                >
                  {content.sections.map((section, idx) => (
                    <section key={idx}>
                      <h3 className="text-base font-semibold text-[#3538CD] mb-3 leading-snug">
                        {section.heading}
                      </h3>
                      <div className="text-sm text-[#475467] leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                      {idx < content.sections.length - 1 && (
                        <Separator className="mt-8 bg-[#F0F0F2]" />
                      )}
                    </section>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-[#FCFCFD] border border-[#E6E6E6] flex items-center justify-center mb-5">
                    <BookOpen className="w-8 h-8 text-[#C4C4C4]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1D2939] mb-1.5">
                    Содержание скоро появится
                  </h3>
                  <p className="text-sm text-[#909AA5] max-w-xs leading-relaxed">
                    Материалы для этого урока находятся в разработке и будут
                    добавлены в ближайшее время.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="shrink-0 border-t border-[#E6E6E6] bg-[#FCFCFD] px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                {/* Complete checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={onToggleComplete}
                    className={cn(
                      "rounded-md shrink-0",
                      isCompleted &&
                        "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium truncate transition-colors",
                      isCompleted
                        ? "text-green-600"
                        : "text-[#475467]"
                    )}
                  >
                    {isCompleted ? "Выполнено" : "Отметить выполненным"}
                  </span>
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                </label>

                {/* Navigation */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={!prevLesson}
                    className="gap-1 text-xs h-8 px-3"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Назад</span>
                  </Button>

                  {/* Progress indicator */}
                  <span className="text-[11px] text-[#909AA5] font-medium whitespace-nowrap">
                    {lesson.number} из {module.lessons.length}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!nextLesson}
                    className="gap-1 text-xs h-8 px-3"
                  >
                    <span className="hidden sm:inline">Далее</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Module progress text */}
              <div className="mt-3 flex items-center gap-2">
                <Progress
                  value={moduleProgress}
                  className={cn(
                    "h-1.5 flex-1",
                    moduleProgress === 100 && "[&>[data-slot=progress-indicator]]:bg-green-500"
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-semibold shrink-0",
                    moduleProgress === 100 ? "text-green-600" : "text-[#737373]"
                  )}
                >
                  {moduleProgress}%
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
