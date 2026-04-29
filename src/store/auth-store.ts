"use client";

import { create } from "zustand";

interface AuthState {
  admin: boolean;
  username: string | null;
  loaded: boolean;
  loading: boolean;
  fetchMe: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: false,
  username: null,
  loaded: false,
  loading: false,

  fetchMe: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { admin: boolean; username: string | null };
      set({ admin: data.admin, username: data.username, loaded: true, loading: false });
    } catch {
      set({ admin: false, username: null, loaded: true, loading: false });
    }
  },

  login: async (username, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        let msg = `Ошибка ${res.status}`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) msg = data.error;
        } catch {
          // ignore
        }
        return { ok: false, error: msg };
      }
      set({ admin: true, username, loaded: true });
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Сетевая ошибка",
      };
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    set({ admin: false, username: null });
  },
}));
