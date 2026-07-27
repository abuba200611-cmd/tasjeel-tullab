import { createStudent, findStudentByUsername } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();

  if (!name) {
    return Response.json({ error: "الاسم مطلوب" }, { status: 400 });
  }
  if (username.length < 3) {
    return Response.json({ error: "اسم المستخدم ٣ أحرف فأكثر" }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ error: "كلمة المرور ٨ أحرف فأكثر" }, { status: 400 });
  }
  if (await findStudentByUsername(username)) {
    return Response.json({ error: "اسم المستخدم مستخدم من قبل" }, { status: 409 });
  }

  const id = await createStudent(username, hashPassword(password), name);
  await setSessionCookie(id);

  return Response.json({ student: { id, username, name } });
}
