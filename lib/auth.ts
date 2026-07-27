import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { findStudentById, sessionSecret } from "./db";
import type { Student } from "./types";

export const SESSION_COOKIE = "tullab_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // ٣٠ يوماً

/** تجزئة كلمة المرور بـ scrypt — مدمج في Node، فلا حاجة لمكتبة خارجية */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const candidate = scryptSync(password, salt, expected.length);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

async function sign(payload: string): Promise<string> {
  return createHmac("sha256", await sessionSecret()).update(payload).digest("hex");
}

export async function createSessionToken(studentId: number): Promise<string> {
  const payload = `${studentId}.${Date.now()}`;
  return `${payload}.${await sign(payload)}`;
}

/** يتحقق من التوقيع والصلاحية، ويرجع معرّف الطالب أو null */
export async function readSessionToken(token: string): Promise<number | null> {
  const [idPart, issuedPart, signature] = token.split(".");
  if (!idPart || !issuedPart || !signature) return null;

  const expected = await sign(`${idPart}.${issuedPart}`);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  const issuedAt = Number(issuedPart);
  const studentId = Number(idPart);
  if (!Number.isFinite(issuedAt) || !Number.isInteger(studentId)) return null;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

  return studentId;
}

export async function setSessionCookie(studentId: number): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(studentId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** الطالب صاحب الجلسة الحالية، أو null إن لم يكن مسجّلاً */
export async function currentStudent(): Promise<Student | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const studentId = await readSessionToken(token);
  return studentId === null ? null : findStudentById(studentId);
}

/** رد موحّد لمن ليس مسجّل الدخول */
export function unauthorized(): Response {
  return Response.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
}
