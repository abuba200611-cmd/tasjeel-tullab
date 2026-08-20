import { describe, expect, it } from "vitest";
import { estimateHifzRange, estimateReviewRange, isKnownSurah, juzLabel, juzOfPage, TOTAL_PAGES } from "./quran";

describe("isKnownSurah", () => {
  it("يتعرّف على سورة حقيقية", () => {
    expect(isKnownSurah("البقرة")).toBe(true);
  });

  it("يرفض اسماً غير موجود", () => {
    expect(isKnownSurah("سورة غير موجودة")).toBe(false);
  });
});

describe("estimateHifzRange", () => {
  it("يبني نطاقاً يبدأ من أول صفحة السورة", () => {
    const range = estimateHifzRange("الفاتحة", 1);
    expect(range).toEqual({ from: 1, to: 1 });
  });

  it("يرجع null لو عدد الصفحات أكبر من صفحات السورة", () => {
    expect(estimateHifzRange("الفاتحة", 999)).toBeNull();
  });

  it("يرجع null لسورة غير معروفة", () => {
    expect(estimateHifzRange("سورة وهمية", 1)).toBeNull();
  });

  it("يرجع null لعدد صفحات صفر أو سالب", () => {
    expect(estimateHifzRange("البقرة", 0)).toBeNull();
    expect(estimateHifzRange("البقرة", -1)).toBeNull();
  });
});

describe("estimateReviewRange", () => {
  it("يبدأ من أسبق سورة بترتيب المصحف بغض النظر عن ترتيب الاختيار", () => {
    // البقرة قبل آل عمران بترتيب المصحف رغم إنها أُدخلت ثانية هنا
    const range = estimateReviewRange(["آل عمران", "البقرة"], 5);
    const bqara = estimateHifzRange("البقرة", 1)!;
    expect(range?.from).toBe(bqara.from);
  });

  it("لا يتجاوز نهاية المصحف حتى مع عدد صفحات كبير جداً", () => {
    const range = estimateReviewRange(["الناس"], 999999);
    expect(range?.to).toBe(TOTAL_PAGES);
  });

  it("يرجع null لقائمة سور فارغة", () => {
    expect(estimateReviewRange([], 5)).toBeNull();
  });
});

describe("juzOfPage / juzLabel معاً", () => {
  it("يحسبان تسمية صحيحة لجزء الصفحة الأولى", () => {
    expect(juzLabel([juzOfPage(1)])).toBe("جزء 1");
  });
});
