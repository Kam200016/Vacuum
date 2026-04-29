"use client";

import { Search, BookOpen, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProgressStore } from "@/store/progress-store";
import { courseData, getTotalLessons } from "@/data/course-data";
import { Progress } from "@/components/ui/progress";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  const totalProgress = useProgressStore((s) => s.getTotalProgress(courseData));
  const totalLessons = getTotalLessons();
  const completedCount = useProgressStore((s) => s.completedLessons.length);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E6E6E6]">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#FCFCFD] transition-colors"
            aria-label="Переключить меню"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {sidebarOpen ? (
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path d="M3 5h14" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                  <path d="M3 10h14" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                  <path d="M3 15h14" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3538CD] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 1L2 5v8l7 4 7-4V5L9 1z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 1v16M2 5l7 4 7-4M2 13l7-4 7 4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold text-[#1D2939] leading-tight">
                Вакуумная техника
              </h1>
              <p className="text-xs text-[#737373]">
                {completedCount} из {totalLessons} уроков
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
            <Input
              type="text"
              placeholder="Поиск уроков..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-9 h-9 bg-[#FCFCFD] border-[#E6E6E6] rounded-lg text-sm placeholder:text-[#909AA5] focus-visible:ring-[#3538CD]/20 focus-visible:border-[#3538CD]/40"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5 text-[#737373]" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Overall progress */}
        <div className="hidden md:flex items-center gap-3">
          <div className="w-36">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[#737373]">Прогресс</span>
              <span className="text-xs font-semibold text-[#3538CD]">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-1.5 bg-[#E6E6E6]" />
          </div>
        </div>
      </div>
    </header>
  );
}
