CREATE TABLE IF NOT EXISTS students (
  id            SERIAL PRIMARY KEY,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  created_at    TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS wards (
  id            SERIAL PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date          TEXT    NOT NULL,
  hifz_from     INTEGER,
  hifz_to       INTEGER,
  hifz_surah    TEXT,
  hifz_pages    INTEGER,
  review_from   INTEGER,
  review_to     INTEGER,
  review_surahs TEXT,
  review_pages  INTEGER,
  note          TEXT    NOT NULL DEFAULT '',
  created_at    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wards_student ON wards(student_id, date DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
