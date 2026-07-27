import "server-only";

import { getDatabase } from "@netlify/database";
import { randomBytes } from "node:crypto";
import type { PageRange, Student, StudentSummary, WardLog } from "./types";

/*
  نظام مستقل تماماً عن نظام المعلّم، بقاعدة بيانات Postgres خاصة به
  (Netlify DB). المخطط في netlify/database/migrations/ — يُطبَّق تلقائياً
  عند النشر. كل الوصول يمرّ من هنا، فيبقى أي تبديل لاحق محصوراً في هذا الملف.
*/

/*
  فتح كسول: getDatabase() يرمي خطأ فوراً لو لم يجد سلسلة اتصال، وهذا
  يحدث أثناء "جمع بيانات الصفحات" وقت next build محلياً (لا توجد بيئة
  Netlify حقيقية بعد). نؤجّل الإنشاء لأول استخدام فعلي داخل كل دالة.
*/
let dbInstance: ReturnType<typeof getDatabase> | null = null;
function db(): ReturnType<typeof getDatabase> {
  if (!dbInstance) dbInstance = getDatabase();
  return dbInstance;
}

/** سرّ توقيع الجلسات — من البيئة إن وُجد، وإلا يُولَّد مرة ويُحفظ */
export async function sessionSecret(): Promise<string> {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv) return fromEnv;

  const rows = await db().sql`SELECT value FROM app_settings WHERE key = 'session_secret'`;
  if (rows[0]) return rows[0].value as string;

  const generated = randomBytes(32).toString("hex");
  await db().sql`INSERT INTO app_settings (key, value) VALUES ('session_secret', ${generated})
    ON CONFLICT (key) DO NOTHING`;
  const after = await db().sql`SELECT value FROM app_settings WHERE key = 'session_secret'`;
  return (after[0]?.value as string) ?? generated;
}

/**
 * سرّ يشترك فيه نظام المعلّم عند سحب ملخّص طالب — من البيئة إن وُجد،
 * وإلا يُولَّد مرة ويُحفظ. منفصل عن sessionSecret لأن هذا يُشارك مع
 * نظام خارجي بينما ذاك خاص بجلسات هذا النظام فقط.
 */
export async function linkSecret(): Promise<string> {
  const fromEnv = process.env.LINK_SECRET;
  if (fromEnv) return fromEnv;

  const rows = await db().sql`SELECT value FROM app_settings WHERE key = 'link_secret'`;
  if (rows[0]) return rows[0].value as string;

  const generated = randomBytes(24).toString("hex");
  await db().sql`INSERT INTO app_settings (key, value) VALUES ('link_secret', ${generated})
    ON CONFLICT (key) DO NOTHING`;
  const after = await db().sql`SELECT value FROM app_settings WHERE key = 'link_secret'`;
  return (after[0]?.value as string) ?? generated;
}

// ————— الطلاب —————

export async function createStudent(username: string, passwordHash: string, name: string): Promise<number> {
  const rows = await db().sql`
    INSERT INTO students (username, password_hash, name, created_at)
    VALUES (${username}, ${passwordHash}, ${name}, ${new Date().toISOString()})
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function findStudentByUsername(
  username: string,
): Promise<{ id: number; username: string; passwordHash: string; name: string } | null> {
  const rows = await db().sql`SELECT * FROM students WHERE username = ${username}`;
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, username: row.username, passwordHash: row.password_hash, name: row.name };
}

export async function findStudentById(id: number): Promise<Student | null> {
  const rows = await db().sql`
    SELECT id, username, name, created_at FROM students WHERE id = ${id}
  `;
  const row = rows[0];
  return row
    ? { id: row.id, username: row.username, name: row.name, createdAt: row.created_at }
    : null;
}

// ————— الورد اليومي —————

function toRange(from: number | null, to: number | null): PageRange | null {
  return from !== null && to !== null ? { from, to } : null;
}

function rowToWard(row: Record<string, unknown>): WardLog {
  return {
    id: row.id as number,
    studentId: row.student_id as number,
    date: row.date as string,
    hifz: toRange(row.hifz_from as number | null, row.hifz_to as number | null),
    hifzSurah: (row.hifz_surah as string | null) ?? null,
    hifzPages: (row.hifz_pages as number | null) ?? null,
    review: toRange(row.review_from as number | null, row.review_to as number | null),
    reviewSurahs: row.review_surahs ? (JSON.parse(row.review_surahs as string) as string[]) : [],
    reviewPages: (row.review_pages as number | null) ?? null,
    note: row.note as string,
    createdAt: row.created_at as string,
  };
}

export async function addWard(
  studentId: number,
  ward: {
    date: string;
    hifz: { range: PageRange; surah: string; pages: number } | null;
    review: { range: PageRange; surahs: string[]; pages: number } | null;
    note: string;
  },
): Promise<number> {
  const rows = await db().sql`
    INSERT INTO wards
      (student_id, date, hifz_from, hifz_to, hifz_surah, hifz_pages,
       review_from, review_to, review_surahs, review_pages, note, created_at)
    VALUES (
      ${studentId}, ${ward.date},
      ${ward.hifz?.range.from ?? null}, ${ward.hifz?.range.to ?? null},
      ${ward.hifz?.surah ?? null}, ${ward.hifz?.pages ?? null},
      ${ward.review?.range.from ?? null}, ${ward.review?.range.to ?? null},
      ${ward.review ? JSON.stringify(ward.review.surahs) : null}, ${ward.review?.pages ?? null},
      ${ward.note}, ${new Date().toISOString()}
    )
    RETURNING id
  `;
  return Number(rows[0].id);
}

export async function listWards(studentId: number): Promise<WardLog[]> {
  const rows = await db().sql`
    SELECT id, student_id, date, hifz_from, hifz_to, hifz_surah, hifz_pages,
           review_from, review_to, review_surahs, review_pages, note, created_at
    FROM wards WHERE student_id = ${studentId} ORDER BY date DESC, id DESC
  `;
  return rows.map(rowToWard);
}

export async function deleteWard(studentId: number, id: number): Promise<boolean> {
  const rows = await db().sql`
    DELETE FROM wards WHERE student_id = ${studentId} AND id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

// ————— ملخّص للربط مع نظام المعلّم —————

/**
 * آخر حفظ وآخر مراجعة سجّلهما الطالب — هذا ما يسحبه نظام المعلّم،
 * لا كل السجل. "آخر" يعني أحدث يوم فيه قيمة لذلك النوع تحديداً،
 * لأن يوماً قد يحمل حفظاً فقط أو مراجعة فقط.
 */
export async function getStudentSummary(username: string): Promise<StudentSummary | null> {
  const student = await findStudentByUsername(username);
  if (!student) return null;

  const hifzRows = await db().sql`
    SELECT date, hifz_from, hifz_to, hifz_surah FROM wards
    WHERE student_id = ${student.id} AND hifz_from IS NOT NULL
    ORDER BY date DESC, id DESC LIMIT 1
  `;
  const reviewRows = await db().sql`
    SELECT date, review_from, review_to, review_surahs FROM wards
    WHERE student_id = ${student.id} AND review_from IS NOT NULL
    ORDER BY date DESC, id DESC LIMIT 1
  `;
  const lastRows = await db().sql`
    SELECT MAX(date) as d FROM wards WHERE student_id = ${student.id}
  `;

  const hifzRow = hifzRows[0];
  const reviewRow = reviewRows[0];

  return {
    name: student.name,
    latestHifz: hifzRow ? { from: hifzRow.hifz_from, to: hifzRow.hifz_to } : null,
    latestHifzDate: hifzRow?.date ?? null,
    latestHifzSurah: hifzRow?.hifz_surah ?? null,
    latestReview: reviewRow ? { from: reviewRow.review_from, to: reviewRow.review_to } : null,
    latestReviewDate: reviewRow?.date ?? null,
    latestReviewSurahs: reviewRow?.review_surahs ? (JSON.parse(reviewRow.review_surahs) as string[]) : [],
    lastWardDate: lastRows[0]?.d ?? null,
  };
}
