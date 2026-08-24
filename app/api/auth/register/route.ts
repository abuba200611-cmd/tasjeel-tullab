import { checkRegisterRateLimit, createEmailVerification, createStudent, findStudentByUsername, linkSecret } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { sendMail } from "@/lib/mail";

/** أول عنوان بترويسة x-forwarded-for، أو "unknown" محلياً بلا بروكسي */
function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * تسجيل عبر رابط دعوة حلقة: يخبر نظام المعلّم لينشئ سجل الطالب بحلقته
 * ويربطه فوراً — بلا أي إدخال يدوي من المعلّم. لا يفشل التسجيل أبداً
 * لو تعذّر هذا النداء (رمز خاطئ، أو نظام المعلّم غير متاح مؤقتاً).
 */
async function joinHalaqahByInvite(inviteCode: string, username: string, studentName: string): Promise<void> {
  const teacherAppUrl = process.env.TEACHER_APP_URL;
  if (!teacherAppUrl) return;
  try {
    await fetch(`${teacherAppUrl}/api/link/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-link-secret": await linkSecret() },
      body: JSON.stringify({ inviteCode, linkUsername: username, studentName }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // تجاهل — الطالب يقدر يُربط يدوياً لاحقاً من صفحة الطلاب بنظام المعلّم
  }
}

export async function POST(request: Request) {
  if (!(await checkRegisterRateLimit(clientIp(request)))) {
    return Response.json(
      { error: "محاولات كثيرة، حاول بعد شوي" },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // نخزّن البريد بعمود "username" القديم نفسه لتفادي ترحيل مخطط قاعدة البيانات —
  // هو فعلياً بريد إلكتروني الآن من واجهة المستخدم وطبقة التحقق فقط.
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const inviteCode = String(body.inviteCode ?? "").trim();

  if (!name) {
    return Response.json({ error: "الاسم مطلوب" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    return Response.json({ error: "أدخل بريداً إلكترونياً صحيحاً" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "كلمة المرور ٨ أحرف فأكثر" }, { status: 400 });
  }
  if (await findStudentByUsername(username)) {
    return Response.json({ error: "هذا البريد مسجّل من قبل" }, { status: 409 });
  }

  const id = await createStudent(username, hashPassword(password), name);
  await setSessionCookie(id);

  if (inviteCode) await joinHalaqahByInvite(inviteCode, username, name);

  const token = await createEmailVerification(id);
  const origin = new URL(request.url).origin;
  const link = `${origin}/verify-email?token=${token}`;
  await sendMail(
    username,
    "أكّد بريدك — ورد الطالب",
    `<div dir="rtl" style="font-family:sans-serif"><p>أهلاً ${name}، أكمل تسجيلك بتأكيد بريدك.</p><p><a href="${link}">اضغط هنا لتأكيد البريد</a> (صالح ٢٤ ساعة).</p></div>`,
  );

  return Response.json({ student: { id, username, name, emailVerified: false } });
}
