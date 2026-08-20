-- رموز استرجاع كلمة المرور — الرمز نفسه لا يُخزَّن، بل بصمته (هاش) فقط،
-- وله صلاحية ساعة واحدة ويُحذف بعد الاستخدام.
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  token_hash TEXT    NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TEXT    NOT NULL
);
