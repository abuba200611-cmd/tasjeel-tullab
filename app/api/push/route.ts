import { currentStudent, unauthorized } from "@/lib/auth";
import { deletePushSubscription, savePushSubscription } from "@/lib/db";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  const student = await currentStudent();
  if (!student) return unauthorized();

  const publicKey = await getVapidPublicKey();
  if (!publicKey) return Response.json({ error: "الإشعارات غير متاحة" }, { status: 503 });
  return Response.json({ publicKey });
}

export async function POST(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  try {
    const body = (await request.json()) as { subscription?: unknown };
    const sub = body.subscription as
      | { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
      | undefined;

    const endpoint = String(sub?.endpoint ?? "").trim();
    const p256dh = String(sub?.keys?.p256dh ?? "").trim();
    const auth = String(sub?.keys?.auth ?? "").trim();
    if (!endpoint || !p256dh || !auth) throw new Error("بيانات الاشتراك ناقصة");

    await savePushSubscription(student.id, { endpoint, p256dh, auth });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذّر تفعيل الإشعارات" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as { endpoint?: unknown };
  const endpoint = String(body.endpoint ?? "").trim();
  if (endpoint) await deletePushSubscription(endpoint);
  return Response.json({ ok: true });
}
