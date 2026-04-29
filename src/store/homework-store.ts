"use client";

import { create } from "zustand";

export interface HomeworkSubmissionDto {
  id: string;
  lessonId: string;
  moduleId: string;
  studentName: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HomeworkState {
  submissions: HomeworkSubmissionDto[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  addSubmission: (s: HomeworkSubmissionDto) => void;
  updateSubmission: (s: HomeworkSubmissionDto) => void;
  removeSubmission: (id: string) => void;
}

export const useHomeworkStore = create<HomeworkState>((set, get) => ({
  submissions: [],
  loaded: false,
  loading: false,
  error: null,

  fetchAll: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/homework", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        submissions: HomeworkSubmissionDto[];
      };
      set({ submissions: data.submissions, loaded: true, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load homework",
      });
    }
  },

  addSubmission: (s) => {
    set((state) => ({ submissions: [s, ...state.submissions] }));
  },

  updateSubmission: (s) => {
    set((state) => ({
      submissions: state.submissions.map((x) => (x.id === s.id ? s : x)),
    }));
  },

  removeSubmission: (id) => {
    set((state) => ({
      submissions: state.submissions.filter((x) => x.id !== id),
    }));
  },
}));
