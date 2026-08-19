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
