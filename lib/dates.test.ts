import { describe, expect, it } from "vitest";
import { currentStreak, monthKey, monthLabel, summarizeByMonth, todayISO } from "./dates";

function daysAgo(n: number): string {
  const d = new Date(`${todayISO()}T00:00:00`);
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("currentStreak", () => {
  it("يرجع صفراً بلا أي ورد", () => {
    expect(currentStreak([])).toBe(0);
  });

  it("يحسب سلسلة تنتهي اليوم", () => {
    expect(currentStreak([daysAgo(2), daysAgo(1), daysAgo(0)])).toBe(3);
  });

  it("يحسب سلسلة تنتهي أمس (لو ما سجّل اليوم بعد)", () => {
    expect(currentStreak([daysAgo(2), daysAgo(1)])).toBe(2);
  });

  it("يتوقف عند أول فجوة", () => {
    expect(currentStreak([daysAgo(5), daysAgo(1), daysAgo(0)])).toBe(2);
  });

  it("يرجع صفراً لو آخر ورد كان قبل يومين أو أكثر (انكسرت السلسلة)", () => {
    expect(currentStreak([daysAgo(3)])).toBe(0);
  });
});

describe("monthKey / monthLabel", () => {
  it("يستخرج مفتاح الشهر من التاريخ", () => {
    expect(monthKey("2026-08-20")).toBe("2026-08");
  });

  it("يبني تسمية عربية صحيحة", () => {
    expect(monthLabel("2026-08")).toBe("أغسطس 2026");
  });
});

describe("summarizeByMonth", () => {
  it("يجمع صفحات الحفظ والمراجعة لكل شهر على حدة", () => {
    const wards = [
      { id: 1, studentId: 1, date: "2026-08-01", hifz: null, hifzSurah: null, hifzPages: 3, review: null, reviewSurahs: [], reviewPages: null, note: "", createdAt: "" },
      { id: 2, studentId: 1, date: "2026-08-05", hifz: null, hifzSurah: null, hifzPages: 2, review: null, reviewSurahs: [], reviewPages: 4, note: "", createdAt: "" },
      { id: 3, studentId: 1, date: "2026-07-20", hifz: null, hifzSurah: null, hifzPages: 1, review: null, reviewSurahs: [], reviewPages: null, note: "", createdAt: "" },
    ];
    const months = summarizeByMonth(wards);
    expect(months).toHaveLength(2);
    expect(months[0].key).toBe("2026-08"); // الأحدث أولاً
    expect(months[0].hifzPages).toBe(5);
    expect(months[0].reviewPages).toBe(4);
    expect(months[0].activeDays).toBe(2);
    expect(months[1].key).toBe("2026-07");
  });
});
