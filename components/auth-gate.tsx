"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Button, Card } from "./ui";
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
          <span className="font-naskh text-lg font-bold text-primary">ورد الطالب</span>
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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
            <span className="text-xs text-muted-foreground">اسم المستخدم</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "لحظة…" : mode === "register" ? "إنشاء الحساب" : "دخول"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
