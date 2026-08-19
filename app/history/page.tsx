"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { Card, Empty, Stat } from "@/components/ui";
import { monthKey, monthLabel } from "@/lib/dates";
import type { WardLog } from "@/lib/types";

export default function HistoryPage() {
  return (
    <AuthGate>
      <HistoryDashboard />
    </AuthGate>
  );
}

type MonthSummary = {
  key: string;
  hifzPages: number;
  reviewPages: number;
  hifzDays: number;
  reviewDays: number;
  activeDays: number;
};

function summarizeByMonth(wards: WardLog[]): MonthSummary[] {
  const byMonth = new Map<string, MonthSummary>();

  for (const ward of wards) {
    const key = monthKey(ward.date);
    const entry = byMonth.get(key) ?? {
      key,
      hifzPages: 0,
      reviewPages: 0,
      hifzDays: 0,
      reviewDays: 0,
      activeDays: 0,
    };
    if (ward.hifzPages) {
      entry.hifzPages += ward.hifzPages;
      entry.hifzDays += 1;
    }
    if (ward.reviewPages) {
      entry.reviewPages += ward.reviewPages;
      entry.reviewDays += 1;
    }
    entry.activeDays += 1;
    byMonth.set(key, entry);
  }

  return [...byMonth.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

function HistoryDashboard() {
  const [wards, setWards] = useState<WardLog[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/wards");
      if (res.ok) {
        const data = (await res.json()) as { wards?: WardLog[] };
        setWards(data.wards ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const months = useMemo(() => summarizeByMonth(wards ?? []), [wards]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-naskh text-2xl font-bold">السجلّ الشهري</h1>
        <p className="text-sm text-muted-foreground">كم صفحة حفظت وراجعت كل شهر، حسب ورودك المسجّلة.</p>
      </div>

      {loading || !wards ? (
        <Empty title="جارٍ التحميل…" />
      ) : months.length === 0 ? (
        <Empty title="ما فيه ورد مسجّل بعد لعرض سجلّ شهري." />
      ) : (
        <ul className="space-y-3">
          {months.map((month) => (
            <li key={month.key}>
              <Card className="p-4">
                <h2 className="mb-3 font-naskh text-lg font-bold">{monthLabel(month.key)}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="صفحات الحفظ" value={month.hifzPages} hint={`${month.hifzDays} يوم`} />
                  <Stat label="صفحات المراجعة" value={month.reviewPages} hint={`${month.reviewDays} يوم`} />
                  <Stat label="مجموع الصفحات" value={month.hifzPages + month.reviewPages} />
                  <Stat label="أيام نشطة" value={month.activeDays} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
