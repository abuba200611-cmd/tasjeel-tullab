export const TOTAL_PAGES = 604;
export const TOTAL_JUZ = 30;

/** أول صفحة من كل جزء في مصحف المدينة — الحدود الفعلية لا التوزيع المتساوي */
const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 121, 142, 162, 182,
  201, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
] as const;

export function juzOfPage(page: number): number {
  if (page < 1) return 1;
  if (page > TOTAL_PAGES) return TOTAL_JUZ;
  let juz = 1;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (page >= JUZ_START_PAGES[i]) juz = i + 1;
  }
  return juz;
}

export function juzesOfRange(from: number, to: number): number[] {
  const out: number[] = [];
  for (let j = juzOfPage(from); j <= juzOfPage(to); j++) out.push(j);
  return out;
}

/** وصف مقروء لنطاق أجزاء، مثل: "جزء ٣٠" أو "أجزاء ٢٨–٣٠" */
export function juzLabel(juzes: number[]): string {
  if (juzes.length === 0) return "—";
  if (juzes.length === 1) return `جزء ${juzes[0]}`;
  return `أجزاء ${juzes[0]}–${juzes[juzes.length - 1]}`;
}

/** وصف نطاق صفحات بجزئه المقابل، مثل: "صفحة ٥٨٢ إلى ٦٠٤ · جزء ٣٠" */
export function describeRange(from: number, to: number): string {
  return `صفحة ${from} إلى ${to} · ${juzLabel(juzesOfRange(from, to))}`;
}

/**
 * السور الـ١١٤ بترتيب المصحف وصفحة بداية كل سورة في مصحف المدينة.
 * تُستخدم لتحويل اختيار الطالب للسورة إلى نطاق صفحات تقريبي — الطالب
 * يختار سورة وعدد صفحات، لا أرقام صفحات دقيقة.
 */
export const SURAHS = [
  { name: "الفاتحة", startPage: 1 },
  { name: "البقرة", startPage: 2 },
  { name: "آل عمران", startPage: 50 },
  { name: "النساء", startPage: 77 },
  { name: "المائدة", startPage: 106 },
  { name: "الأنعام", startPage: 128 },
  { name: "الأعراف", startPage: 151 },
  { name: "الأنفال", startPage: 177 },
  { name: "التوبة", startPage: 187 },
  { name: "يونس", startPage: 208 },
  { name: "هود", startPage: 221 },
  { name: "يوسف", startPage: 235 },
  { name: "الرعد", startPage: 249 },
  { name: "إبراهيم", startPage: 255 },
  { name: "الحجر", startPage: 262 },
  { name: "النحل", startPage: 267 },
  { name: "الإسراء", startPage: 282 },
  { name: "الكهف", startPage: 293 },
  { name: "مريم", startPage: 305 },
  { name: "طه", startPage: 312 },
  { name: "الأنبياء", startPage: 322 },
  { name: "الحج", startPage: 332 },
  { name: "المؤمنون", startPage: 342 },
  { name: "النور", startPage: 350 },
  { name: "الفرقان", startPage: 359 },
  { name: "الشعراء", startPage: 367 },
  { name: "النمل", startPage: 377 },
  { name: "القصص", startPage: 385 },
  { name: "العنكبوت", startPage: 396 },
  { name: "الروم", startPage: 404 },
  { name: "لقمان", startPage: 411 },
  { name: "السجدة", startPage: 415 },
  { name: "الأحزاب", startPage: 418 },
  { name: "سبأ", startPage: 428 },
  { name: "فاطر", startPage: 434 },
  { name: "يس", startPage: 440 },
  { name: "الصافات", startPage: 446 },
  { name: "ص", startPage: 453 },
  { name: "الزمر", startPage: 458 },
  { name: "غافر", startPage: 467 },
  { name: "فصلت", startPage: 477 },
  { name: "الشورى", startPage: 483 },
  { name: "الزخرف", startPage: 489 },
  { name: "الدخان", startPage: 496 },
  { name: "الجاثية", startPage: 499 },
  { name: "الأحقاف", startPage: 502 },
  { name: "محمد", startPage: 507 },
  { name: "الفتح", startPage: 511 },
  { name: "الحجرات", startPage: 515 },
  { name: "ق", startPage: 518 },
  { name: "الذاريات", startPage: 520 },
  { name: "الطور", startPage: 523 },
  { name: "النجم", startPage: 526 },
  { name: "القمر", startPage: 528 },
  { name: "الرحمن", startPage: 531 },
  { name: "الواقعة", startPage: 534 },
  { name: "الحديد", startPage: 537 },
  { name: "المجادلة", startPage: 542 },
  { name: "الحشر", startPage: 545 },
  { name: "الممتحنة", startPage: 549 },
  { name: "الصف", startPage: 551 },
  { name: "الجمعة", startPage: 553 },
  { name: "المنافقون", startPage: 554 },
  { name: "التغابن", startPage: 556 },
  { name: "الطلاق", startPage: 558 },
  { name: "التحريم", startPage: 560 },
  { name: "الملك", startPage: 562 },
  { name: "القلم", startPage: 564 },
  { name: "الحاقة", startPage: 566 },
  { name: "المعارج", startPage: 568 },
  { name: "نوح", startPage: 570 },
  { name: "الجن", startPage: 572 },
  { name: "المزمل", startPage: 574 },
  { name: "المدثر", startPage: 575 },
  { name: "القيامة", startPage: 577 },
  { name: "الإنسان", startPage: 578 },
  { name: "المرسلات", startPage: 580 },
  { name: "النبأ", startPage: 582 },
  { name: "النازعات", startPage: 583 },
  { name: "عبس", startPage: 585 },
  { name: "التكوير", startPage: 586 },
  { name: "الإنفطار", startPage: 587 },
  { name: "المطففين", startPage: 587 },
  { name: "الإنشقاق", startPage: 589 },
  { name: "البروج", startPage: 590 },
  { name: "الطارق", startPage: 591 },
  { name: "الأعلى", startPage: 591 },
  { name: "الغاشية", startPage: 592 },
  { name: "الفجر", startPage: 593 },
  { name: "البلد", startPage: 594 },
  { name: "الشمس", startPage: 595 },
  { name: "الليل", startPage: 595 },
  { name: "الضحى", startPage: 596 },
  { name: "الشرح", startPage: 596 },
  { name: "التين", startPage: 597 },
  { name: "العلق", startPage: 597 },
  { name: "القدر", startPage: 598 },
  { name: "البينة", startPage: 598 },
  { name: "الزلزلة", startPage: 599 },
  { name: "العاديات", startPage: 599 },
  { name: "القارعة", startPage: 600 },
  { name: "التكاثر", startPage: 600 },
  { name: "العصر", startPage: 601 },
  { name: "الهمزة", startPage: 601 },
  { name: "الفيل", startPage: 601 },
  { name: "قريش", startPage: 602 },
  { name: "الماعون", startPage: 602 },
  { name: "الكوثر", startPage: 602 },
  { name: "الكافرون", startPage: 603 },
  { name: "النصر", startPage: 603 },
  { name: "المسد", startPage: 603 },
  { name: "الإخلاص", startPage: 604 },
  { name: "الفلق", startPage: 604 },
  { name: "الناس", startPage: 604 },
] as const;

const SURAH_NAMES: Set<string> = new Set(SURAHS.map((s) => s.name));

export function isKnownSurah(name: string): boolean {
  return SURAH_NAMES.has(name);
}

/** آخر صفحة تقع فيها السورة (قبل أن تبدأ التي تليها) */
function surahEndPage(index: number): number {
  return index < SURAHS.length - 1 ? SURAHS[index + 1].startPage - 1 : TOTAL_PAGES;
}

export function surahPageRange(name: string): { from: number; to: number } | null {
  const index = SURAHS.findIndex((s) => s.name === name);
  if (index === -1) return null;
  return { from: SURAHS[index].startPage, to: surahEndPage(index) };
}

/**
 * نطاق تقريبي لحفظ صفحات معيّنة داخل سورة واحدة — الطالب يختار السورة
 * وعدد الصفحات، لا أرقام صفحات دقيقة. نفترض البداية من أول صفحة في
 * السورة، والعدد لا يتجاوز صفحاتها.
 */
export function estimateHifzRange(
  surah: string,
  pages: number,
): { from: number; to: number } | null {
  const range = surahPageRange(surah);
  if (!range) return null;
  const maxPages = range.to - range.from + 1;
  if (pages < 1 || pages > maxPages) return null;
  return { from: range.from, to: range.from + pages - 1 };
}

/**
 * نطاق تقريبي (وليس دقيقاً) لمراجعة تشمل عدة سور بعدد صفحات إجمالي —
 * نبدأ من أول صفحة لأسبق سورة مختارة (بترتيب المصحف) ونمتد بعدد
 * الصفحات المُدخل. هذا تقدير يكفي لحساب الجزء وملخّص الربط، لا سجلّاً
 * دقيقاً لكل صفحة رُوجعت.
 */
export function estimateReviewRange(
  surahs: string[],
  pages: number,
): { from: number; to: number } | null {
  if (surahs.length === 0 || pages < 1) return null;
  const ranges = surahs.map(surahPageRange).filter((r): r is { from: number; to: number } => !!r);
  if (ranges.length === 0) return null;

  const from = Math.min(...ranges.map((r) => r.from));
  const to = Math.min(TOTAL_PAGES, from + pages - 1);
  return { from, to };
}
