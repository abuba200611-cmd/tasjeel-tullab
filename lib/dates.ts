import type { WardLog } from "./types";

export const MONTH_NAMES = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

/** "YYYY-MM" من تاريخ "YYYY-MM-DD" */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/** "أغسطس ٢٠٢٦" من "YYYY-MM" — الرقم غربي عمداً كباقي الأرقام بالتطبيق */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "YYYY-MM-DD" بالتوقيت المحلي — نفس صيغة تاريخ الورد المخزّن */
export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/*
  نبني السلسلة يدوياً من مكوّنات التاريخ المحلية بدل toISOString() —
  تلك تحوّل لتوقيت UTC فتُرجع يوماً خاطئاً بأي منطقة زمنية شرق غرينتش
  (مثل السعودية UTC+3)، وهو خطأ حقيقي كشفه اختبار هذا الملف بالضبط.
*/
function addDays(dateISO: string, delta: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type MonthSummary = {
  key: string;
  hifzPages: number;
  reviewPages: number;
  hifzDays: number;
  reviewDays: number;
  activeDays: number;
};

/** يجمّع سجل ورد بالشهر — الأحدث أولاً — لعرض سجلّ الطالب أو زميله شهرياً */
export function summarizeByMonth(wards: WardLog[]): MonthSummary[] {
  const byMonth = new Map<string, MonthSummary>();

  for (const ward of wards) {
    const key = monthKey(ward.date);
    const entry = byMonth.get(key) ?? {
      key,
      hifzPages: 0,
      reviewPages: 0,
      hifzDays: 0,
      reviewDays: 0,
      activeDays: 0,
    };
    if (ward.hifzPages) {
      entry.hifzPages += ward.hifzPages;
      entry.hifzDays += 1;
    }
    if (ward.reviewPages) {
      entry.reviewPages += ward.reviewPages;
      entry.reviewDays += 1;
    }
    entry.activeDays += 1;
    byMonth.set(key, entry);
  }

  return [...byMonth.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

/**
 * عدد الأيام المتتالية (لغاية اليوم أو أمس) اللي سجّل فيها الطالب وِرداً
 * — يبدأ العدّ من اليوم لو سجّل اليوم، وإلا من أمس (حتى ما تنكسر السلسلة
 * فوراً قبل ما ينتهي يومه). أول يوم فيه فجوة يوقف العدّ.
 */
export function currentStreak(wardDates: string[]): number {
  const days = new Set(wardDates);
  const today = todayISO();
  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
