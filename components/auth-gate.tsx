"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "./ui";
import { PeerRequestBadge } from "./peer-request-badge";
import type { Student } from "@/lib/types";

const StudentContext = createContext<Student | null>(null);

/** الطالب صاحب الجلسة الحالية داخل الصفحات المحمية */
export function useStudent(): Student {
  const student = useContext(StudentContext);
  if (!student) throw new Error("useStudent خارج AuthGate");
  return student;
}

/**
 * يحرس التطبيق: لا يعرض المحتوى قبل التحقق من الجلسة.
 * الحماية الفعلية على الخادم في مسارات الـ API — هذي طبقة تجربة استخدام.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { student: Student | null }) => {
        if (!cancelled) setStudent(data.student);
      })
      .catch(() => {
        if (!cancelled) setStudent(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setStudent(null);
  }, []);

  if (checking) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <p className="text-sm text-muted-foreground">جارٍ التحقق…</p>
      </main>
    );
  }

  if (!student) {
    return <AuthScreen onAuthenticated={setStudent} />;
  }

  return (
    <StudentContext.Provider value={student}>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-naskh text-lg font-bold text-primary">
              ورد الطالب
            </Link>
            <Link
              href="/peers"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              زملاء المراجعة
              <PeerRequestBadge />
            </Link>
            <Link
              href="/history"
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              السجلّ الشهري
            </Link>
            <Link
              href="/suggest"
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              اقتراح تطوير
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{student.name}</span>
            <Button variant="ghost" onClick={logout}>
              خروج
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </StudentContext.Provider>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (student: Student) => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("googleError"),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (error) window.history.replaceState(null, "", window.location.pathname);
  }, [error]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      });
      const data = (await res.json()) as { student?: Student; error?: string };
      if (!res.ok || !data.student) {
        setError(data.error ?? "تعذّر إتمام العملية");
        return;
      }
      onAuthenticated(data.student);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-center font-naskh text-2xl font-bold text-primary">ورد الطالب</h1>
      <p className="mb-5 text-center text-sm text-muted-foreground">
        سجّل حفظك ومراجعتك اليومية وتابع سجلّك
      </p>

      <Card className="p-5">
        <div className="mb-4 flex gap-1 border-b border-border">
          {(["register", "login"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                setError(null);
              }}
              className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm transition-colors duration-200 ${
                mode === value
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {value === "register" ? "حساب جديد" : "تسجيل الدخول"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <label className="block text-sm">
              <span className="text-xs text-muted-foreground">الاسم</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك الكامل"
                required
                className={field}
              />
            </label>
          )}

          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">البريد الإلكتروني</span>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="email"
              required
              className={field}
            />
          </label>

          <label className="block text-sm">
            <span className="text-xs text-muted-foreground">كلمة المرور</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "register" ? 8 : undefined}
              className={field}
            />
          </label>

          {mode === "login" && (
            <Link href="/forgot-password" className="block text-left text-xs text-primary hover:underline">
              نسيت كلمة المرور؟
            </Link>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "لحظة…" : mode === "register" ? "إنشاء الحساب" : "دخول"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          أو
          <span className="h-px flex-1 bg-border" />
        </div>

        <a
          href="/api/auth/google/start"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <GoogleIcon />
          الدخول بحساب جوجل
        </a>
      </Card>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.2-5.5l-6.6-5.6c-2 1.5-4.6 2.4-7.6 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.4 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}
