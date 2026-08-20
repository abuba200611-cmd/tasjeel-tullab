"use client";

import { useEffect } from "react";

/**
 * لوحة المطوّر صارت صفحة واحدة موحّدة تجمع اقتراحات النظامين معاً —
 * تعيش بمشروع حلقات (halaqat-tahfeez) وتقرأ من قاعدتي البيانات الاثنتين.
 * راجع lib/tasjeel-db.ts هناك.
 */
const UNIFIED_ADMIN_URL = "https://halaqat-tahfeez.vercel.app/admin";

export default function AdminRedirect() {
  useEffect(() => {
    window.location.replace(UNIFIED_ADMIN_URL);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10 text-center">
      <p className="text-sm text-muted-foreground">
        لوحة الاقتراحات انتقلت لصفحة موحّدة —{" "}
        <a href={UNIFIED_ADMIN_URL} className="text-primary underline">
          افتحها من هنا
        </a>
        .
      </p>
    </main>
  );
}
