import { currentStudent, unauthorized } from "@/lib/auth";
import { addSuggestion } from "@/lib/db";

const MAX_LENGTH = 1000;

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { message?: unknown };
  const message = String(body.message ?? "").trim().slice(0, MAX_LENGTH);
  if (!message) {
    return Response.json({ error: "اكتب اقتراحك أولاً" }, { status: 400 });
  }

  await addSuggestion(student.id, `${student.name} (${student.username})`, message);
  return Response.json({ ok: true });
}
