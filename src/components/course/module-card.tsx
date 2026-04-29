"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Rocket,
  Settings,
  Gauge,
  Puzzle,
  Wrench,
  FlaskConical,
  BookOpen,
  CheckCircle2,
  Beaker,
  Video,
  FileText,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/store/progress-store";
import { useVideosStore } from "@/store/videos-store";
import { usePresentationsStore } from "@/store/presentations-store";
import { useHomeworkStore } from "@/store/homework-store";
import { Checkbox } from "@/components/ui/checkbox";
import type { Module, Lesson } from "@/data/course-data";

const iconMap: Record<string, React.ElementType> = {
  rocket: Rocket,
  settings: Settings,
  gauge: Gauge,
  puzzle: Puzzle,
  wrench: Wrench,
  flask: FlaskConical,
};

const moduleColors = [
  { bg: "bg-[#3538CD]", light: "bg-[#3538CD]/8", text: "text-[#3538CD]" },
  { bg: "bg-[#1C0694]", light: "bg-[#1C0694]/8", text: "text-[#1C0694]" },
  { bg: "bg-[#7C3AED]", light: "bg-[#7C3AED]/8", text: "text-[#7C3AED]" },
  { bg: "bg-[#6366F1]", light: "bg-[#6366F1]/8", text: "text-[#6366F1]" },
  { bg: "bg-[#8B5CF6]", light: "bg-[#8B5CF6]/8", text: "text-[#8B5CF6]" },
  { bg: "bg-[#4F46E5]", light: "bg-[#4F46E5]/8", text: "text-[#4F46E5]" },
];

interface ModuleCardProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
  onLessonClick?: (lesson: Lesson) => void;
}

export function ModuleCard({ module, isExpanded, onToggle, searchQuery, onLessonClick }: ModuleCardProps) {
  const [hovered, setHovered] = useState(false);
  const { toggleLesson, isLessonCompleted, getModuleProgress } = useProgressStore();
  const progress = getModuleProgress(module.id, module.lessons);
  const completedCount = module.lessons.filter((l) => isLessonCompleted(l.id)).length;
  const videos = useVideosStore((s) => s.videos);
  const videoCount = module.lessons.reduce(
    (acc, l) => (videos[l.id] ? acc + 1 : acc),
    0,
  );
  const presentations = usePresentationsStore((s) => s.presentations);
  const presentationCount = module.lessons.reduce(
    (acc, l) => (presentations[l.id] ? acc + 1 : acc),
    0,
  );
  const homeworkSubmissions = useHomeworkStore((s) => s.submissions);
  const homeworkLessonIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of homeworkSubmissions) ids.add(s.lessonId);
    return ids;
  }, [homeworkSubmissions]);
  const homeworkCount = module.lessons.reduce(
    (acc, l) => (homeworkLessonIds.has(l.id) ? acc + 1 : acc),
    0,
  );
  const Icon = iconMap[module.icon] || BookOpen;
  const color = moduleColors[(module.number - 1) % moduleColors.length];

  // Filter lessons by search
  const filteredLessons = searchQuery
    ? module.lessons.filter((l) =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : module.lessons;

  const showModule =
    !searchQuery ||
    module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    filteredLessons.length > 0;

  if (!showModule) return null;

  const lessonsToShow = searchQuery ? filteredLessons : module.lessons;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "bg-[#FCFCFD] border rounded-xl transition-all duration-200 overflow-hidden",
        hovered
          ? "border-[rgba(53,56,205,0.4)] shadow-[0_4px_12px_0_rgb(0_0_0/0.08)]"
          : "border-[#E6E6E6] shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]",
        isExpanded && "border-[rgba(53,56,205,0.3)] shadow-[0_4px_12px_0_rgb(0_0_0/0.08)]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Module Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        {/* Icon */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            color.bg
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-semibold", color.text)}>
              Модуль {module.number}
            </span>
            <span className="text-xs text-[#909AA5]">•</span>
            <span className="text-xs text-[#909AA5]">
              {module.lessons.length}{" "}
              {module.lessons.length === 1 ? "урок" : "уроков"}
            </span>
            {videoCount > 0 && (
              <span
                className="flex items-center gap-1 text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full"
                title={`Видео загружено для ${videoCount} из ${module.lessons.length} уроков`}
              >
                <Video className="w-3 h-3" />
                {videoCount}/{module.lessons.length}
              </span>
            )}
            {presentationCount > 0 && (
              <span
                className="flex items-center gap-1 text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full"
                title={`Презентация загружена для ${presentationCount} из ${module.lessons.length} уроков`}
              >
                <FileText className="w-3 h-3" />
                {presentationCount}/{module.lessons.length}
              </span>
            )}
            {homeworkCount > 0 && (
              <span
                className="flex items-center gap-1 text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full"
                title={`Загружены работы по ${homeworkCount} из ${module.lessons.length} уроков`}
              >
                <ClipboardList className="w-3 h-3" />
                {homeworkCount}/{module.lessons.length}
              </span>
            )}
            {progress === 100 && (
              <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
                ЗАВЕРШЁН
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-[#1D2939] leading-snug">
            {module.title}
          </h3>
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[#E6E6E6] rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  progress === 100 ? "bg-green-500" : "bg-[#3538CD]"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-medium shrink-0",
                progress === 100 ? "text-green-600" : "text-[#737373]"
              )}
            >
              {completedCount}/{module.lessons.length}
            </span>
          </div>
        </div>

        {/* Expand/Collapse Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#909AA5]" />
        </motion.div>
      </button>

      {/* Lessons List */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[#E6E6E6]">
              <div className="pt-4 space-y-1 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                {lessonsToShow.map((lesson: Lesson) => {
                  const completed = isLessonCompleted(lesson.id);
                  const hasVideo = Boolean(videos[lesson.id]);
                  const hasPresentation = Boolean(presentations[lesson.id]);
                  const hasHomework = homeworkLessonIds.has(lesson.id);
                  return (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: lesson.number * 0.03 }}
                      onClick={() => onLessonClick?.(lesson)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onLessonClick?.(lesson);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                        onLessonClick && "cursor-pointer",
                        completed
                          ? "bg-green-50/50"
                          : "hover:bg-[#F5F5F7]"
                      )}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={completed}
                          onCheckedChange={() => toggleLesson(lesson.id)}
                          className={cn(
                            "rounded-md",
                            completed && "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm leading-snug transition-colors",
                            completed
                              ? "text-[#909AA5] line-through"
                              : "text-[#1A1A1A] group-hover:text-[#3538CD]"
                          )}
                        >
                          {lesson.number}. {lesson.title}
                        </p>
                      </div>
                      {hasVideo && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full shrink-0"
                          title="Видеоурок загружен"
                        >
                          <Video className="w-3 h-3" />
                          Видео
                        </span>
                      )}
                      {hasPresentation && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full shrink-0"
                          title="Презентация загружена"
                        >
                          <FileText className="w-3 h-3" />
                          Слайды
                        </span>
                      )}
                      {hasHomework && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full shrink-0"
                          title="Есть загруженные работы"
                        >
                          <ClipboardList className="w-3 h-3" />
                          ДЗ
                        </span>
                      )}
                      {lesson.isPractice && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#3538CD] bg-[#3538CD]/8 px-2 py-0.5 rounded-full shrink-0">
                          <Beaker className="w-3 h-3" />
                          Практика
                        </span>
                      )}
                      {completed && !lesson.isPractice && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                      {onLessonClick && !completed && !lesson.isPractice && (
                        <ChevronRight className="w-4 h-4 text-[#C4C4C4] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
