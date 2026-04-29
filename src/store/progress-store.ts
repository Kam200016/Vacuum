import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Module } from "@/data/course-data";

interface ProgressState {
  completedLessons: string[];
  toggleLesson: (lessonId: string) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  getModuleProgress: (moduleId: string, lessons: { id: string }[]) => number;
  getTotalProgress: (modules: Module[]) => number;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: [],

      toggleLesson: (lessonId: string) => {
        set((state) => {
          const exists = state.completedLessons.includes(lessonId);
          return {
            completedLessons: exists
              ? state.completedLessons.filter((id) => id !== lessonId)
              : [...state.completedLessons, lessonId],
          };
        });
      },

      isLessonCompleted: (lessonId: string) => {
        return get().completedLessons.includes(lessonId);
      },

      getModuleProgress: (moduleId: string, lessons: { id: string }[]) => {
        const completed = get().completedLessons;
        const total = lessons.length;
        if (total === 0) return 0;
        const done = lessons.filter((l) => completed.includes(l.id)).length;
        return Math.round((done / total) * 100);
      },

      getTotalProgress: (modules: Module[]) => {
        const completed = get().completedLessons;
        const total = modules.reduce((sum, m) => sum + m.lessons.length, 0);
        if (total === 0) return 0;
        const done = modules.reduce(
          (sum, m) => sum + m.lessons.filter((l) => completed.includes(l.id)).length,
          0
        );
        return Math.round((done / total) * 100);
      },

      resetProgress: () => {
        set({ completedLessons: [] });
      },
    }),
    {
      name: "vacuum-course-progress",
      skipHydration: true,
    }
  )
);
