import "server-only";

import webpush from "web-push";
import {
  deletePushSubscription,
  listPushSubscriptions,
  listSubscribedStudentsWithoutWardOn,
  setVapidKeys,
  vapidKeys,
} from "./db";

/*
  إشعارات الويب (Web Push) عبر مكتبة web-push — نفس نمط نظام المعلّم
  (halaqat-tahfeez) بالضبط، بمفاتيح VAPID مستقلة خاصة بهذا النظام.
*/

const CONTACT = "mailto:tasjeel@example.com";
let configured = false;

async function ensureConfigured(): Promise<string | null> {
  try {
    let keys = await vapidKeys();
    if (!keys) {
      const generated = webpush.generateVAPIDKeys();
      await setVapidKeys(generated.publicKey, generated.privateKey);
      keys = generated;
    }
    if (!configured) {
      webpush.setVapidDetails(CONTACT, keys.publicKey, keys.privateKey);
      configured = true;
    }
    return keys.publicKey;
  } catch {
    return null;
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  return ensureConfigured();
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

async function sendTo(sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await deletePushSubscription(sub.endpoint);
  }
}

/** يرسل إشعاراً لكل أجهزة طالب واحد — لا يرمي أبداً */
export async function sendPushToStudent(studentId: number, payload: PushPayload): Promise<void> {
  const publicKey = await ensureConfigured();
  if (!publicKey) return;

  const subs = await listPushSubscriptions(studentId);
  await Promise.all(subs.map((sub) => sendTo(sub, payload)));
}

/**
 * التذكير اليومي: يرسل لكل طالب مشترك بالإشعارات ما سجّل ورداً بتاريخ
 * اليوم بعد. يرجع عدد من أُرسل لهم — يستدعيه مسار Cron مرة كل مساء.
 */
export async function sendDailyReminders(todayISO: string): Promise<number> {
  const publicKey = await ensureConfigured();
  if (!publicKey) return 0;

  const subs = await listSubscribedStudentsWithoutWardOn(todayISO);
  await Promise.all(
    subs.map((sub) =>
      sendTo(sub, {
        title: "ورد الطالب",
        body: "ما سجّلت ورد اليوم بعد — افتح التطبيق وسجّل حفظك أو مراجعتك.",
        url: "/",
        tag: "daily-reminder",
      }),
    ),
  );
  return subs.length;
}
