import { currentStudent, unauthorized } from "@/lib/auth";
import { listWardsOfPeer } from "@/lib/db";

/** سجلّ زميل مرتبط كاملاً — GET /api/peers/wards?peerId=123 */
export async function GET(request: Request) {
  const student = await currentStudent();
  if (!student) return unauthorized();

  const peerId = Number(new URL(request.url).searchParams.get("peerId"));
  if (!Number.isInteger(peerId)) {
    return Response.json({ error: "معرّف الزميل مفقود" }, { status: 400 });
  }

  try {
    return Response.json({ wards: await listWardsOfPeer(student.id, peerId) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذّر جلب السجلّ" },
      { status: 403 },
    );
  }
}
