-- ربط طالب بطالب آخر للتسميع المتبادل: طلب من أحدهما، وموافقة الآخر،
-- ثم كل طرف يشوف سجلّ الطرف الثاني كاملاً. لا علاقة له بربط الطالب
-- بنظام المعلّم (student_links هناك) — هذا بين طالبين داخل هذا النظام فقط.
CREATE TABLE IF NOT EXISTS peer_links (
  id           SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  target_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status       TEXT    NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted'
  created_at   TEXT    NOT NULL,
  responded_at TEXT,
  CONSTRAINT peer_links_not_self CHECK (requester_id <> target_id)
);

-- زوج واحد بس بين أي طالبين بغض النظر عن مين طلب أول — يمنع تكرار
-- الطلب أو طلبين متقاطعين بين نفس الطالبين بنفس الوقت.
CREATE UNIQUE INDEX IF NOT EXISTS idx_peer_links_pair
  ON peer_links (LEAST(requester_id, target_id), GREATEST(requester_id, target_id));

CREATE INDEX IF NOT EXISTS idx_peer_links_target ON peer_links(target_id, status);
CREATE INDEX IF NOT EXISTS idx_peer_links_requester ON peer_links(requester_id, status);
