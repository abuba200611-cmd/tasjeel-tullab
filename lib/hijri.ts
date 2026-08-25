/**
 * يحوّل تاريخاً ميلادياً (YYYY-MM-DD) لصيغة هجرية معروضة — يعتمد على
 * تقويم أمّ القرى المدمج بالمتصفح (Intl)، بلا أي مكتبة خارجية. يرجع
 * نصاً فارغاً لو التاريخ غير صالح بدل ما يرمي خطأ يكسر النموذج.
 */
export function toHijriLabel(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}
