import { currentStudent, unauthorized } from "@/lib/auth";
import { listPeerLinks, removePeerLink, requestPeerLink, respondPeerLink } from "@/lib/db";

export async function GET() {
  const student = await currentStudent();
  if (!student) return unauthorized();

  return Response.json(await listPeerLinks(student.id));
}

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { targetEmail?: unknown };
  const targetEmail = String(body.targetEmail ?? "").trim().toLowerCase();
  if (!targetEmail) {
    return Response.json({ error: "أدخل بريد الطالب اللي تبي تربطه" }, { status: 400 });
  }

  try {
    await requestPeerLink(student.id, targetEmail);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذّر إرسال الطلب" },
      { status: 400 },
    );
  }
}

/** body: { id, action: "accept" | "reject" | "remove" } */
export async function PATCH(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { id?: unknown; action?: unknown };
  const id = Number(body.id);
  const action = String(body.action ?? "");
  if (!Number.isInteger(id) || !["accept", "reject", "remove"].includes(action)) {
    return Response.json({ error: "طلب غير صحيح" }, { status: 400 });
  }

  const ok =
    action === "remove"
      ? await removePeerLink(student.id, id)
      : await respondPeerLink(student.id, id, action === "accept");

  if (!ok) return Response.json({ error: "الطلب غير موجود أو انتهى" }, { status: 404 });
  return Response.json({ ok: true });
}
