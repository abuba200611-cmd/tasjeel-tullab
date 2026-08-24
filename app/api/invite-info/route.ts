import { linkSecret } from "@/lib/db";

/** عنوان نظام المعلّم (halaqat-tahfeez) — نفس المتغيّر المستخدم بإشعار الورد الجديد */
const TEACHER_APP_URL = process.env.TEACHER_APP_URL;

/**
 * يعرض للطالب اسم الحلقة/المعلّم قبل التسجيل عبر رابط دعوة، عن طريق سؤال
 * نظام المعلّم من الخادم (لا يمكن نداءه من المتصفح مباشرة لأنه يحتاج
 * السرّ المشترك). فشل هذا النداء لا يمنع التسجيل — مجرد عرض تجميلي.
 */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!code || !TEACHER_APP_URL) return Response.json({ ok: false });

  try {
    const res = await fetch(`${TEACHER_APP_URL}/api/link/invite-info?code=${encodeURIComponent(code)}`, {
      headers: { "x-link-secret": await linkSecret() },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return Response.json({ ok: false });
    const data = (await res.json()) as { teacherName?: string; halaqahName?: string };
    return Response.json({ ok: true, ...data });
  } catch {
    return Response.json({ ok: false });
  }
}
