import { currentStudent, unauthorized } from "@/lib/auth";
import { addWard, deleteWard, listWards } from "@/lib/db";
import { estimateHifzRange, estimateReviewRange, isKnownSurah } from "@/lib/quran";
import type { PageRange } from "@/lib/types";

const MAX_PAGES_PER_WARD = 604;

/**
 * حفظ اليوم: سورة واحدة + عدد صفحات. نتحقق من أن السورة معروفة وأن
 * العدد يقع ضمن صفحاتها فعلاً (estimateHifzRange يرجع null لو تجاوزها).
 */
function parseHifz(raw: unknown): { range: PageRange; surah: string; pages: number } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") throw new Error("صيغة الحفظ غير صحيحة");

  const obj = raw as Record<string, unknown>;
  const surah = String(obj.surah ?? "").trim();
  if (!surah) return null;
  if (!isKnownSurah(surah)) throw new Error("سورة الحفظ غير معروفة");

  const pages = Number(obj.pages);
  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error("أدخل عدد صفحات الحفظ");
  }

  const range = estimateHifzRange(surah, pages);
  if (!range) throw new Error(`عدد صفحات الحفظ أكبر من صفحات سورة ${surah}`);

  return { range, surah, pages };
}

/**
 * مراجعة اليوم: عدة سور + عدد صفحات إجمالي. النطاق تقديري (من أول
 * سورة مختارة بترتيب المصحف، بامتداد عدد الصفحات) — يكفي لحساب الجزء
 * وملخّص الربط، لا سجلّاً دقيقاً لكل صفحة.
 */
function parseReview(
  raw: unknown,
): { range: PageRange; surahs: string[]; pages: number } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") throw new Error("صيغة المراجعة غير صحيحة");

  const obj = raw as Record<string, unknown>;
  const surahs = (Array.isArray(obj.surahs) ? obj.surahs : []).map((s) => String(s).trim());
  if (surahs.length === 0) return null;

  for (const surah of surahs) {
    if (!isKnownSurah(surah)) throw new Error(`سورة غير معروفة في المراجعة: ${surah}`);
  }

  const pages = Number(obj.pages);
  if (!Number.isInteger(pages) || pages < 1 || pages > MAX_PAGES_PER_WARD) {
    throw new Error("أدخل عدد صفحات المراجعة");
  }

  const range = estimateReviewRange(surahs, pages);
  if (!range) throw new Error("تعذّر حساب نطاق المراجعة");

  return { range, surahs, pages };
}

/** YYYY-MM-DD صالح؟ */
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

export async function GET() {
  const student = await currentStudent();
  if (!student) return unauthorized();

  return Response.json({ wards: await listWards(student.id) });
}

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const hifz = parseHifz(body.hifz);
    const review = parseReview(body.review);
    if (!hifz && !review) {
      throw new Error("سجّل حفظاً أو مراجعة على الأقل");
    }

    const date = String(body.date ?? "").trim();
    if (!isValidDate(date)) {
      throw new Error("التاريخ غير صحيح");
    }

    const note = String(body.note ?? "").trim().slice(0, 500);
    const id = await addWard(student.id, { date, hifz, review, note });
    return Response.json({ ok: true, id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذّر حفظ الورد" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  const id = Number(body.id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "معرّف السجل مفقود" }, { status: 400 });
  }
  if (!(await deleteWard(student.id, id))) {
    return Response.json({ error: "السجل غير موجود" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
