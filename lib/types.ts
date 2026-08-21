/** الطالب صاحب الحساب — يسجّل بنفسه */
export type Student = {
  id: number;
  username: string;
  name: string;
  createdAt: string;
  emailVerified: boolean;
};

/** نطاق صفحات في المصحف */
export type PageRange = { from: number; to: number };

/**
 * سجلّ ورد يومي يرسله الطالب: ما حفظه جديداً وما راجعه، بالسورة لا
 * برقم الصفحة. نطاق الصفحات (hifz/review) يبقى محسوباً تلقائياً من
 * السورة وعدد الصفحات — لعرض الجزء ولملخّص الربط مع نظام المعلّم.
 * كلاهما اختياري — قد يكون اليوم حفظاً فقط أو مراجعة فقط.
 */
export type WardLog = {
  id: number;
  studentId: number;
  /** YYYY-MM-DD */
  date: string;
  hifz: PageRange | null;
  hifzSurah: string | null;
  hifzPages: number | null;
  review: PageRange | null;
  reviewSurahs: string[];
  reviewPages: number | null;
  note: string;
  /** وقت الإرسال بتوقيت UTC: YYYY-MM-DD HH:MM:SS */
  createdAt: string;
};

/** اشتراك دفع للإشعارات على جهاز الطالب */
export type PushSubscriptionData = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/** ما يُصدَّر لنظام المعلّم عبر رابط السحب — آخر حفظ وآخر مراجعة فقط */
export type StudentSummary = {
  name: string;
  latestHifz: PageRange | null;
  latestHifzDate: string | null;
  latestHifzSurah: string | null;
  latestReview: PageRange | null;
  latestReviewDate: string | null;
  latestReviewSurahs: string[];
  lastWardDate: string | null;
};
