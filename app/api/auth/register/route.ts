import { createStudent, findStudentByUsername } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  // نخزّن البريد بعمود "username" القديم نفسه لتفادي ترحيل مخطط قاعدة البيانات —
  // هو فعلياً بريد إلكتروني الآن من واجهة المستخدم وطبقة التحقق فقط.
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();

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

  return Response.json({ student: { id, username, name } });
}
