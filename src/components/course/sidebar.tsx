"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Settings,
  Gauge,
  Puzzle,
  Wrench,
  FlaskConical,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { courseData } from "@/data/course-data";
import { useProgressStore } from "@/store/progress-store";
import { cn } from "@/lib/utils";
import type { Module } from "@/data/course-data";

const iconMap: Record<string, React.ElementType> = {
  rocket: Rocket,
  settings: Settings,
  gauge: Gauge,
  puzzle: Puzzle,
  wrench: Wrench,
  flask: FlaskConical,
};

interface SidebarProps {
  open: boolean;
  activeModuleId: string | null;
  onSelectModule: (moduleId: string) => void;
  onClose: () => void;
}

export function Sidebar({ open, activeModuleId, onSelectModule, onClose }: SidebarProps) {
  const getModuleProgress = useProgressStore((s) => s.getModuleProgress);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 z-40 w-72 bg-white border-r border-[#E6E6E6] overflow-y-auto transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4">
          <p className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-3 px-3">
            Модули курса
          </p>
          <nav className="space-y-1">
            {courseData.map((mod: Module) => {
              const Icon = iconMap[mod.icon] || BookOpen;
              const progress = getModuleProgress(mod.id, mod.lessons);
              const isActive = activeModuleId === mod.id;

              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    onSelectModule(mod.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group",
                    isActive
                      ? "bg-[#3538CD]/8 border border-[#3538CD]/20"
                      : "hover:bg-[#FCFCFD] border border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isActive ? "bg-[#3538CD] text-white" : "bg-[#FCFCFD] text-[#737373] group-hover:text-[#3538CD]"
                    )}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isActive ? "text-[#3538CD]" : "text-[#909AA5]"
                        )}
                      >
                        М{mod.number}
                      </span>
                      {progress === 100 && (
                        <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          ✓
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm font-medium truncate leading-tight",
                        isActive ? "text-[#1D2939]" : "text-[#1A1A1A]"
                      )}
                    >
                      {mod.title}
                    </p>
                    {/* Mini progress bar */}
                    <div className="mt-1.5 h-1 bg-[#E6E6E6] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          progress === 100 ? "bg-green-500" : "bg-[#3538CD]"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform duration-200",
                      isActive ? "text-[#3538CD]" : "text-[#909AA5]"
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
