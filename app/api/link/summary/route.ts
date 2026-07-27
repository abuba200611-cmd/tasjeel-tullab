import { getStudentSummary, linkSecret } from "@/lib/db";

/**
 * نقطة قراءة فقط لنظام المعلّم: يرسل اسم مستخدم الطالب هنا ويرجع
 * آخر حفظ وآخر مراجعة سجّلهما. محمية بسرّ مشترك بين النظامين
 * (ترويسة x-link-secret) — ليست جلسة طالب، هذا نداء خادم لخادم.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-link-secret");
  if (!secret || secret !== (await linkSecret())) {
    return Response.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = (searchParams.get("username") ?? "").trim();
  if (!username) {
    return Response.json({ error: "اسم المستخدم مطلوب" }, { status: 400 });
  }

  const summary = await getStudentSummary(username);
  if (!summary) {
    return Response.json({ error: "لا يوجد طالب بهذا الاسم" }, { status: 404 });
  }

  return Response.json({ summary });
}
