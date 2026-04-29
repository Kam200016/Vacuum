"use client";

import { create } from "zustand";

export interface LessonVideoDto {
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

interface VideosState {
  videos: Record<string, LessonVideoDto>;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  setVideo: (video: LessonVideoDto) => void;
  removeVideo: (lessonId: string) => void;
}

export const useVideosStore = create<VideosState>((set, get) => ({
  videos: {},
  loaded: false,
  loading: false,
  error: null,

  fetchAll: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/videos", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { videos: LessonVideoDto[] };
      const map: Record<string, LessonVideoDto> = {};
      for (const v of data.videos) {
        map[v.lessonId] = v;
      }
      set({ videos: map, loaded: true, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load videos",
      });
    }
  },

  setVideo: (video) => {
    set((state) => ({
      videos: { ...state.videos, [video.lessonId]: video },
    }));
  },

  removeVideo: (lessonId) => {
    set((state) => {
      const next = { ...state.videos };
      delete next[lessonId];
      return { videos: next };
    });
  },
}));
