"use client";

import { create } from "zustand";

export interface LessonPresentationDto {
  id: string;
  lessonId: string;
  moduleId: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

interface PresentationsState {
  presentations: Record<string, LessonPresentationDto>;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  setPresentation: (presentation: LessonPresentationDto) => void;
  removePresentation: (lessonId: string) => void;
}

export const usePresentationsStore = create<PresentationsState>((set, get) => ({
  presentations: {},
  loaded: false,
  loading: false,
  error: null,

  fetchAll: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/presentations", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        presentations: LessonPresentationDto[];
      };
      const map: Record<string, LessonPresentationDto> = {};
      for (const p of data.presentations) {
        map[p.lessonId] = p;
      }
      set({ presentations: map, loaded: true, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load presentations",
      });
    }
  },

  setPresentation: (presentation) => {
    set((state) => ({
      presentations: {
        ...state.presentations,
        [presentation.lessonId]: presentation,
      },
    }));
  },

  removePresentation: (lessonId) => {
    set((state) => {
      const next = { ...state.presentations };
      delete next[lessonId];
      return { presentations: next };
    });
  },
}));
