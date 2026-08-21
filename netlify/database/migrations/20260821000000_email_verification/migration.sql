-- تأكيد ملكية البريد عند التسجيل بكلمة مرور (حسابات جوجل موثّقة أصلاً
-- من جوجل نفسها، ما تحتاج هذا). لا يمنع الدخول.
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS email_verifications (
  id         SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash TEXT    NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TEXT    NOT NULL
);
