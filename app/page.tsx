"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGate, useStudent } from "@/components/auth-gate";
import { Badge, Button, Card, Empty } from "@/components/ui";
import { PushToggle } from "@/components/push-toggle";
import { currentStreak, todayISO } from "@/lib/dates";
import { SURAHS, estimateHifzRange, estimateReviewRange, juzLabel, juzesOfRange } from "@/lib/quran";
import type { WardLog } from "@/lib/types";

export default function Page() {
  return (
    <AuthGate>
      <WardDashboard />
    </AuthGate>
  );
}

function WardDashboard() {
  const student = useStudent();
  const [wards, setWards] = useState<WardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WardLog | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/wards");
      if (!res.ok) return;
      const data = (await res.json()) as { wards?: WardLog[] };
      setWards(data.wards ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-naskh text-2xl font-bold">أهلاً {student.name}</h1>
          <StreakBadge wards={wards} />
        </div>
        <p className="text-sm text-muted-foreground">سجّل ورد اليوم من الحفظ والمراجعة.</p>
        <div className="mt-2">
          <PushToggle />
        </div>
      </div>

      <WardForm
        key={editing?.id ?? "new"}
        editing={editing}
        onSaved={async () => {
          setEditing(null);
          await refresh();
        }}
        onCancelEdit={() => setEditing(null)}
      />

      <section>
        <h2 className="mb-3 font-naskh text-lg font-bold">سجلّي</h2>
        {loading ? (
          <Empty title="جارٍ التحميل…" />
        ) : wards.length === 0 ? (
          <Empty title="ما سجّلت ورداً بعد. ابدأ بأول ورد من الأعلى." />
        ) : (
          <ul className="space-y-2">
            {wards.map((ward) => (
              <WardRow key={ward.id} ward={ward} onDeleted={refresh} onEdit={() => setEditing(ward)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** عدد الأيام المتتالية اللي سجّل فيها الطالب وِرداً — يظهر بس لو ٢ فأكثر */
function StreakBadge({ wards }: { wards: WardLog[] }) {
  const streak = useMemo(() => currentStreak(wards.map((w) => w.date)), [wards]);
  if (streak < 2) return null;
  return (
    <Badge tone="good">
      🔥 {streak} يوم متتالي
    </Badge>
  );
}

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** حفظ اليوم: سورة واحدة + عدد صفحات — الطالب لا يحتاج يعرف أرقام الصفحات */
function HifzField({
  surah,
  pages,
  onSurahChange,
  onPagesChange,
}: {
  surah: string;
  pages: string;
  onSurahChange: (v: string) => void;
  onPagesChange: (v: string) => void;
}) {
  const pagesNum = Number(pages);
  const range =
    surah && Number.isInteger(pagesNum) && pagesNum > 0 ? estimateHifzRange(surah, pagesNum) : null;
  const preview = range
    ? juzLabel(juzesOfRange(range.from, range.to))
    : surah && pages
      ? "عدد الصفحات أكبر من السورة"
      : "";

  return (
    <fieldset className="rounded-md border border-border p-3">
      <legend className="px-1 text-xs font-semibold text-primary">الحفظ الجديد</legend>
      <div className="flex gap-3">
        <label className="flex-[2] text-sm">
          <span className="text-xs text-muted-foreground">السورة</span>
          <select value={surah} onChange={(e) => onSurahChange(e.target.value)} className={`${fieldClass} cursor-pointer`}>
            <option value="">اختر السورة</option>
            {SURAHS.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 text-sm">
          <span className="text-xs text-muted-foreground">كم صفحة</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={pages}
            onChange={(e) => onPagesChange(e.target.value)}
            className={`${fieldClass} tabular`}
          />
        </label>
      </div>
      {preview && <p className="mt-1.5 text-xs text-muted-foreground">{preview}</p>}
    </fieldset>
  );
}

/** مراجعة اليوم: عدة سور + عدد صفحات إجمالي — قائمة سور قابلة للبحث والاختيار المتعدد */
function ReviewField({
  selected,
  pages,
  onSelectedChange,
  onPagesChange,
}: {
  selected: string[];
  pages: string;
  onSelectedChange: (v: string[]) => void;
  onPagesChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => (query.trim() ? SURAHS.filter((s) => s.name.includes(query.trim())) : SURAHS),
    [query],
  );

  function toggle(name: string) {
    onSelectedChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  }

  const pagesNum = Number(pages);
  const range =
    selected.length > 0 && Number.isInteger(pagesNum) && pagesNum > 0
      ? estimateReviewRange(selected, pagesNum)
      : null;
  const preview = range ? juzLabel(juzesOfRange(range.from, range.to)) : "";

  return (
    <fieldset className="rounded-md border border-border p-3">
      <legend className="px-1 text-xs font-semibold text-primary">المراجعة</legend>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className="cursor-pointer rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary transition-colors duration-200 hover:bg-primary/20"
            >
              {name} ×
            </button>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن سورة لإضافتها"
        className={fieldClass}
      />
      <div className="mt-2 max-h-36 overflow-y-auto rounded-md border border-border">
        {filtered.map((s) => (
          <label
            key={s.name}
            className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
          >
            <input
              type="checkbox"
              checked={selected.includes(s.name)}
              onChange={() => toggle(s.name)}
              className="cursor-pointer"
            />
            {s.name}
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">لا نتائج.</p>
        )}
      </div>

      <label className="mt-3 block text-sm">
        <span className="text-xs text-muted-foreground">كم صفحة راجعت (إجمالاً)</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={pages}
          onChange={(e) => onPagesChange(e.target.value)}
          className={`${fieldClass} tabular`}
        />
      </label>
      {preview && <p className="mt-1.5 text-xs text-muted-foreground">{preview}</p>}
    </fieldset>
  );
}

function WardForm({
  editing,
  onSaved,
  onCancelEdit,
}: {
  editing?: WardLog | null;
  onSaved: () => Promise<void>;
  onCancelEdit: () => void;
}) {
  const [date, setDate] = useState(editing?.date ?? todayISO);
  const [hifzSurah, setHifzSurah] = useState(editing?.hifzSurah ?? "");
  const [hifzPages, setHifzPages] = useState(editing?.hifzPages ? String(editing.hifzPages) : "");
  const [reviewSurahs, setReviewSurahs] = useState<string[]>(editing?.reviewSurahs ?? []);
  const [reviewPages, setReviewPages] = useState(editing?.reviewPages ? String(editing.reviewPages) : "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/wards", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { id: editing.id } : {}),
          date,
          hifz: hifzSurah ? { surah: hifzSurah, pages: Number(hifzPages) } : null,
          review: reviewSurahs.length > 0 ? { surahs: reviewSurahs, pages: Number(reviewPages) } : null,
          note,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "تعذّر حفظ الورد");
        return;
      }
      if (!editing) {
        setHifzSurah("");
        setHifzPages("");
        setReviewSurahs([]);
        setReviewPages("");
        setNote("");
      }
      setSaved(true);
      await onSaved();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      {editing && (
        <div className="mb-3 flex items-center justify-between rounded-md bg-accent/10 px-3 py-1.5 text-xs text-accent">
          <span>تعديل سجل {editing.date}</span>
          <button
            type="button"
            onClick={onCancelEdit}
            className="cursor-pointer font-semibold underline hover:no-underline"
          >
            إلغاء التعديل
          </button>
        </div>
      )}
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">التاريخ</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={`${fieldClass} tabular`}
          />
        </label>

        <HifzField surah={hifzSurah} pages={hifzPages} onSurahChange={setHifzSurah} onPagesChange={setHifzPages} />
        <ReviewField
          selected={reviewSurahs}
          pages={reviewPages}
          onSelectedChange={setReviewSurahs}
          onPagesChange={setReviewPages}
        />

        <label className="block text-sm">
          <span className="text-xs text-muted-foreground">ملاحظة (اختياري)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            className={fieldClass}
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-success">{editing ? "تم حفظ التعديل ✓" : "تم تسجيل الورد ✓"}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "يُحفظ…" : editing ? "حفظ التعديل" : "تسجيل الورد"}
        </Button>
        {!editing && (
          <p className="text-center text-xs text-muted-foreground">
            سجّل الحفظ أو المراجعة أو كليهما — لا يلزم ملء الاثنين.
          </p>
        )}
      </form>
    </Card>
  );
}

function WardRow({
  ward,
  onDeleted,
  onEdit,
}: {
  ward: WardLog;
  onDeleted: () => Promise<void>;
  onEdit: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("حذف هذا السجل؟")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/wards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ward.id }),
      });
      if (res.ok) await onDeleted();
    } finally {
      setBusy(false);
    }
  }

  const hifzJuz = ward.hifz ? juzLabel(juzesOfRange(ward.hifz.from, ward.hifz.to)) : null;
  const reviewJuz = ward.review ? juzLabel(juzesOfRange(ward.review.from, ward.review.to)) : null;

  return (
    <li>
      <Card className="p-3">
        <div className="flex items-start justify-between gap-3">
          <span className="tabular text-sm font-semibold">{ward.date}</span>
          <div className="flex gap-1.5">
            <Button variant="ghost" onClick={onEdit} className="px-2 py-0.5 text-xs">
              تعديل
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy} className="px-2 py-0.5 text-xs">
              حذف
            </Button>
          </div>
        </div>
        <div className="mt-2 space-y-1 text-sm">
          {ward.hifz && (
            <div className="flex items-center gap-2">
              <Badge tone="good">حفظ</Badge>
              <span className="text-muted-foreground">
                {ward.hifzSurah ? `سورة ${ward.hifzSurah}` : hifzJuz}
                {ward.hifzPages ? ` · ${ward.hifzPages} صفحة` : ""}
                {ward.hifzSurah && hifzJuz ? ` (${hifzJuz})` : ""}
              </span>
            </div>
          )}
          {ward.review && (
            <div className="flex items-center gap-2">
              <Badge tone="neutral">مراجعة</Badge>
              <span className="text-muted-foreground">
                {ward.reviewSurahs.length > 0 ? ward.reviewSurahs.join("، ") : reviewJuz}
                {ward.reviewPages ? ` · ${ward.reviewPages} صفحة` : ""}
                {ward.reviewSurahs.length > 0 && reviewJuz ? ` (${reviewJuz})` : ""}
              </span>
            </div>
          )}
          {ward.note && <p className="text-xs text-muted-foreground">📝 {ward.note}</p>}
        </div>
      </Card>
    </li>
  );
}
