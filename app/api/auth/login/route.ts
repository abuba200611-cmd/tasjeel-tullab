import { findStudentByUsername } from "@/lib/db";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  const student = await findStudentByUsername(username);
  // رسالة واحدة للحالتين حتى لا تكشف أي بريد إلكتروني مسجّل من عدمه
  if (!student || !verifyPassword(password, student.passwordHash)) {
    return Response.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
  }

  await setSessionCookie(student.id);
  return Response.json({ student: { id: student.id, username: student.username, name: student.name } });
}
