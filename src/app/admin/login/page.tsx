"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";

export default function AdminLoginPage() {
  const router = useRouter();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const login = useAuthStore((s) => s.login);
  const admin = useAuthStore((s) => s.admin);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (admin) {
      router.replace("/");
    }
  }, [admin, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Введите логин и пароль");
      return;
    }
    setSubmitting(true);
    const result = await login(username.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      router.replace("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FCFCFD] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#1D2939]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            На главную
          </Link>
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#3538CD]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#3538CD]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#1D2939] leading-tight">
                Вход для администратора
              </h1>
              <p className="text-xs text-[#737373] mt-0.5">
                Доступ к загрузке видеоуроков
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-[#475467]">
                Логин
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                className="h-10 bg-[#FCFCFD] border-[#E6E6E6]"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-[#475467]">
                Пароль
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="h-10 bg-[#FCFCFD] border-[#E6E6E6]"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-[#3538CD] hover:bg-[#3538CD]/90 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Вход…
                </>
              ) : (
                "Войти"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
