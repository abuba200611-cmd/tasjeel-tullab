-- اقتراحات تطوير يرسلها الطلاب — تصل للمطوّر فقط عبر لوحة محمية بكلمة سر،
-- لا يشوفها أي طالب أو معلّم آخر.
CREATE TABLE IF NOT EXISTS suggestions (
  id           SERIAL PRIMARY KEY,
  sender_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  sender_label TEXT    NOT NULL,
  message      TEXT    NOT NULL,
  created_at   TEXT    NOT NULL
);
