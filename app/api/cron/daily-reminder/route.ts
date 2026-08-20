import { sendDailyReminders } from "@/lib/push";

/** YYYY-MM-DD بتوقيت UTC — يكفي لمطابقة تواريخ الورد المخزّنة بنفس الصيغة */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * يستدعيه Vercel Cron مرة كل مساء (راجع vercel.json). Vercel يرسل
 * ترويسة Authorization: Bearer <CRON_SECRET> تلقائياً عند ضبط المتغيّر —
 * نتحقق منها لمنع أي طرف آخر من تشغيل التذكير يدوياً.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "غير مصرّح" }, { status: 401 });
    }
  }

  const sent = await sendDailyReminders(todayISO());
  return Response.json({ ok: true, sent });
}
