"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BarChart3,
  Clock,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/course/header";
import { Sidebar } from "@/components/course/sidebar";
import { ModuleCard } from "@/components/course/module-card";
import { LessonView } from "@/components/course/lesson-view";
import { courseData, getTotalLessons } from "@/data/course-data";
import type { Lesson, Module } from "@/data/course-data";
import { useProgressStore } from "@/store/progress-store";

import { lectureContentMap } from "@/data/lecture-content";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ lesson: Lesson; module: Module } | null>(null);

  // Manually rehydrate the persisted Zustand store on the client to avoid SSR/CSR mismatch.
  useEffect(() => {
    useProgressStore.persist.rehydrate();
  }, []);

  const resetProgress = useProgressStore((s) => s.resetProgress);
  const { toggleLesson, isLessonCompleted, getModuleProgress } = useProgressStore();

  // Computed values from the store
  const storeTotalProgress = useProgressStore((s) => s.getTotalProgress(courseData));
  const storeCompletedCount = useProgressStore((s) => s.completedLessons.length);
  const totalLessons = getTotalLessons();

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
    setActiveModuleId(moduleId);
  }, []);

  const selectModule = useCallback((moduleId: string) => {
    setExpandedModules((prev) => new Set(prev).add(moduleId));
    setActiveModuleId(moduleId);

    // Scroll to the module card
    const el = document.getElementById(`module-${moduleId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return courseData;
    const q = searchQuery.toLowerCase();
    return courseData.filter(
      (mod) =>
        mod.title.toLowerCase().includes(q) ||
        mod.lessons.some((l) => l.title.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Helper: find adjacent lessons for navigation
  const getAdjacentLessons = useCallback(
    (lessonId: string, moduleId: string) => {
      const flatLessons: { lesson: Lesson; module: Module }[] = [];
      for (const mod of courseData) {
        for (const lesson of mod.lessons) {
          flatLessons.push({ lesson, module: mod });
        }
      }
      const currentIndex = flatLessons.findIndex(
        (item) => item.lesson.id === lessonId && item.module.id === moduleId
      );
      return {
        prev: currentIndex > 0 ? flatLessons[currentIndex - 1] : null,
        next: currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null,
      };
    },
    []
  );

  const handleLessonClick = useCallback(
    (lesson: Lesson) => {
      const parentModule = courseData.find((m) => m.lessons.some((l) => l.id === lesson.id));
      if (parentModule) {
        setActiveLesson({ lesson, module: parentModule });
      }
    },
    []
  );

  const handleLessonClickClose = useCallback(() => {
    setActiveLesson(null);
  }, []);

  const handleLessonClickToggleComplete = useCallback(() => {
    if (activeLesson) {
      toggleLesson(activeLesson.lesson.id);
    }
  }, [activeLesson, toggleLesson]);

  const handleNavigate = useCallback(
    (lessonId: string, moduleId: string) => {
      const parentModule = courseData.find((m) => m.id === moduleId);
      const lesson = parentModule?.lessons.find((l) => l.id === lessonId);
      if (parentModule && lesson) {
        setActiveLesson({ lesson, module: parentModule });
        setExpandedModules((prev) => new Set(prev).add(moduleId));
      }
    },
    []
  );

  // Auto-expand when searching
  const displayExpandedModules = useMemo(() => {
    if (searchQuery.trim()) {
      return new Set(filteredModules.map((m) => m.id));
    }
    return expandedModules;
  }, [searchQuery, filteredModules, expandedModules]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1">
        <Sidebar
          open={sidebarOpen}
          activeModuleId={activeModuleId}
          onSelectModule={selectModule}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Hero / Stats Section */}
          <div className="bg-gradient-to-br from-[#1C0694] via-[#3538CD] to-[#6366F1] px-4 lg:px-8 py-8 lg:py-12">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">
                    Курсовая программа
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
                  Вакуумная техника
                </h1>
                <p className="text-sm sm:text-base text-white/70 max-w-xl leading-relaxed mb-6">
                  Полный курс вакуумной техники — от фундаментальных основ до
                  практического применения в современной промышленности. 6 модулей,
                  52 урока.
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                  {[
                    {
                      icon: Layers,
                      label: "Модули",
                      value: "6",
                    },
                    {
                      icon: GraduationCap,
                      label: "Уроки",
                      value: String(totalLessons),
                    },
                    {
                      icon: Clock,
                      label: "Практика",
                      value: "6",
                    },
                    {
                      icon: BarChart3,
                      label: "Прогресс",
                      value: `${storeTotalProgress}%`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                    >
                      <stat.icon className="w-4 h-4 text-white/50 mb-1.5" />
                      <p className="text-xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/60">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 lg:px-8 py-6 lg:py-8">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1D2939]">
                  Программа курса
                </h2>
                <p className="text-sm text-[#737373] mt-0.5">
                  {searchQuery
                    ? `Найдено: ${filteredModules.length} ${
                        filteredModules.length === 1 ? "модуль" : "модулей"
                      }`
                    : `${storeCompletedCount} из ${totalLessons} уроков выполнено`}
                </p>
              </div>
              {storeCompletedCount > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm("Сбросить весь прогресс?")) {
                      resetProgress();
                      setExpandedModules(new Set());
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#3538CD] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#FCFCFD]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сбросить прогресс
                </button>
              )}
            </div>

            {/* Module Cards */}
            <div className="space-y-4 max-w-4xl">
              {filteredModules.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-16 h-16 rounded-full bg-[#FCFCFD] border border-[#E6E6E6] flex items-center justify-center mx-auto mb-4">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="11" cy="11" r="8" stroke="#909AA5" strokeWidth="2" />
                      <path d="m21 21-4.35-4.35" stroke="#909AA5" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-[#737373] text-sm">
                    По запросу &laquo;{searchQuery}&raquo; ничего не найдено
                  </p>
                </motion.div>
              ) : (
                filteredModules.map((mod, index) => (
                  <div key={mod.id} id={`module-${mod.id}`}>
                    <ModuleCard
                      module={mod}
                      isExpanded={displayExpandedModules.has(mod.id)}
                      onToggle={() => toggleModule(mod.id)}
                      searchQuery={searchQuery}
                      onLessonClick={handleLessonClick}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lesson View Overlay */}
          {activeLesson && (() => {
            const { prev, next } = getAdjacentLessons(
              activeLesson.lesson.id,
              activeLesson.module.id
            );
            const moduleProgress = getModuleProgress(
              activeLesson.module.id,
              activeLesson.module.lessons
            );
            const lectureContent = lectureContentMap[activeLesson.lesson.id];
            return (
              <LessonView
                lesson={activeLesson.lesson}
                module={activeLesson.module}
                content={lectureContent}
                isOpen={true}
                onClose={handleLessonClickClose}
                isCompleted={isLessonCompleted(activeLesson.lesson.id)}
                onToggleComplete={handleLessonClickToggleComplete}
                prevLesson={prev}
                nextLesson={next}
                onNavigate={handleNavigate}
                moduleProgress={moduleProgress}
              />
            );
          })()}

          {/* Footer */}
          <footer className="mt-auto border-t border-[#E6E6E6] bg-[#FCFCFD] px-4 lg:px-8 py-5">
            <div className="max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-[#909AA5]">
                © 2025 Вакуумная техника — Курсовая программа
              </p>
              <p className="text-xs text-[#909AA5]">
                6 модулей • {totalLessons} уроков • Интерактивный прогресс
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
