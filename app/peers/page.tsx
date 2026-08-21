"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Badge, Button, Card, Empty, Stat } from "@/components/ui";
import { monthLabel, summarizeByMonth } from "@/lib/dates";
import type { WardLog } from "@/lib/types";

type PeerLinkRow = {
  id: number;
  peerId: number;
  peerName: string;
  peerUsername: string;
  status: "pending" | "accepted";
  createdAt: string;
};

type PeerLinks = { incoming: PeerLinkRow[]; outgoing: PeerLinkRow[]; accepted: PeerLinkRow[] };

export default function PeersPage() {
  return (
    <AuthGate>
      <PeersDashboard />
    </AuthGate>
  );
}

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function PeersDashboard() {
  const [links, setLinks] = useState<PeerLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [openPeerId, setOpenPeerId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/peers");
      if (res.ok) setLinks((await res.json()) as PeerLinks);
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
        <h1 className="font-naskh text-2xl font-bold">زملاء المراجعة</h1>
        <p className="text-sm text-muted-foreground">
          اربط نفسك بطالب آخر عشان تتسمّعان لبعض — بعد ما يقبل الطرف الثاني، يشوف كل واحد سجلّ الثاني كاملاً.
        </p>
      </div>

      <RequestForm onSent={refresh} />

      {loading || !links ? (
        <Empty title="جارٍ التحميل…" />
      ) : (
        <>
          {links.incoming.length > 0 && (
            <Section title="طلبات واردة تنتظر ردّك">
              {links.incoming.map((link) => (
                <IncomingRow key={link.id} link={link} onChanged={refresh} />
              ))}
            </Section>
          )}

          {links.outgoing.length > 0 && (
            <Section title="طلبات أرسلتها وتنتظر موافقتهم">
              {links.outgoing.map((link) => (
                <OutgoingRow key={link.id} link={link} onChanged={refresh} />
              ))}
            </Section>
          )}

          <Section title="زملاؤك المرتبطون">
            {links.accepted.length === 0 ? (
              <Empty title="ما فيه زميل مرتبط بعد. أرسل طلباً ببريده من الأعلى." />
            ) : (
              links.accepted.map((link) => (
                <AcceptedRow
                  key={link.id}
                  link={link}
                  open={openPeerId === link.peerId}
                  onToggle={() => setOpenPeerId(openPeerId === link.peerId ? null : link.peerId)}
                  onChanged={refresh}
                />
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-naskh text-lg font-bold">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function RequestForm({ onSent }: { onSent: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSent(false);
    try {
      const res = await fetch("/api/peers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "تعذّر إرسال الطلب");
        return;
      }
      setEmail("");
      setSent(true);
      await onSent();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="flex items-end gap-3">
        <label className="flex-1 text-sm">
          <span className="text-xs text-muted-foreground">بريد الطالب اللي تبي تربطه</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={fieldClass}
          />
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "لحظة…" : "إرسال طلب"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {sent && <p className="mt-2 text-sm text-success">تم إرسال الطلب ✓</p>}
    </Card>
  );
}

function IncomingRow({ link, onChanged }: { link: PeerLinkRow; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  async function respond(action: "accept" | "reject") {
    setBusy(true);
    try {
      await fetch("/api/peers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, action }),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li>
      <Card className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-semibold">{link.peerName}</p>
          <p className="text-xs text-muted-foreground">{link.peerUsername}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => respond("accept")} disabled={busy} className="px-3 py-1 text-xs">
            قبول
          </Button>
          <Button variant="danger" onClick={() => respond("reject")} disabled={busy} className="px-3 py-1 text-xs">
            رفض
          </Button>
        </div>
      </Card>
    </li>
  );
}

function OutgoingRow({ link, onChanged }: { link: PeerLinkRow; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    try {
      await fetch("/api/peers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, action: "remove" }),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li>
      <Card className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-semibold">{link.peerName}</p>
          <p className="text-xs text-muted-foreground">{link.peerUsername}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>بانتظار الموافقة</Badge>
          <Button variant="ghost" onClick={cancel} disabled={busy} className="px-3 py-1 text-xs">
            إلغاء
          </Button>
        </div>
      </Card>
    </li>
  );
}

function AcceptedRow({
  link,
  open,
  onToggle,
  onChanged,
}: {
  link: PeerLinkRow;
  open: boolean;
  onToggle: () => void;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function unlink() {
    if (!confirm(`فكّ الربط مع ${link.peerName}؟`)) return;
    setBusy(true);
    try {
      await fetch("/api/peers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, action: "remove" }),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li>
      <Card className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{link.peerName}</p>
            <p className="text-xs text-muted-foreground">{link.peerUsername}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onToggle} className="px-3 py-1 text-xs">
              {open ? "إخفاء السجلّ" : "عرض السجلّ"}
            </Button>
            <Button variant="danger" onClick={unlink} disabled={busy} className="px-3 py-1 text-xs">
              فكّ الربط
            </Button>
          </div>
        </div>
        {open && <PeerWards peerId={link.peerId} />}
      </Card>
    </li>
  );
}

function PeerWards({ peerId }: { peerId: number }) {
  const [wards, setWards] = useState<WardLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/peers/wards?peerId=${peerId}`)
      .then((res) => res.json())
      .then((data: { wards?: WardLog[]; error?: string }) => {
        if (cancelled) return;
        if (data.wards) setWards(data.wards);
        else setError(data.error ?? "تعذّر جلب السجلّ");
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر الاتصال بالخادم");
      });
    return () => {
      cancelled = true;
    };
  }, [peerId]);

  if (error) return <p className="mt-3 text-sm text-destructive">{error}</p>;
  if (!wards) return <p className="mt-3 text-sm text-muted-foreground">جارٍ التحميل…</p>;
  if (wards.length === 0) return <p className="mt-3 text-sm text-muted-foreground">ما سجّل وِرداً بعد.</p>;

  const months = summarizeByMonth(wards);

  return (
    <ul className="mt-3 space-y-2 border-t border-border pt-3">
      {months.map((month) => (
        <li key={month.key}>
          <p className="mb-1.5 text-sm font-semibold">{monthLabel(month.key)}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="صفحات الحفظ" value={month.hifzPages} hint={`${month.hifzDays} يوم`} />
            <Stat label="صفحات المراجعة" value={month.reviewPages} hint={`${month.reviewDays} يوم`} />
            <Stat label="مجموع الصفحات" value={month.hifzPages + month.reviewPages} />
            <Stat label="أيام نشطة" value={month.activeDays} />
          </div>
        </li>
      ))}
    </ul>
  );
}
