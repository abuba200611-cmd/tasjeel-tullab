import { currentStudent, unauthorized } from "@/lib/auth";
import { createEmailVerification } from "@/lib/db";
import { sendMail } from "@/lib/mail";

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();
  if (student.emailVerified) return Response.json({ ok: true });

  const token = await createEmailVerification(student.id);
  const origin = new URL(request.url).origin;
  const link = `${origin}/verify-email?token=${token}`;
  await sendMail(
    student.username,
    "أكّد بريدك — ورد الطالب",
    `<div dir="rtl" style="font-family:sans-serif"><p><a href="${link}">اضغط هنا لتأكيد البريد</a> (صالح ٢٤ ساعة).</p></div>`,
  );
  return Response.json({ ok: true });
}
