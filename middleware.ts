import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
  STEP 57 — تحويل دائم للنظام الجديد (halaqat-tahfeez). هذا التطبيق
  توقّف تطويره؛ كل مستخدم يفتح أي رابط قديم هنا يُحوَّل فوراً بدل أن
  يظن أن التعديلات لم تصله. middleware لا next.config.redirects لأن:
  1. تمرير رمز الدعوة (?invite=) منطق شرطي بسيط بكود عادي هنا، بدل
     مطابقة regex عبر has/query في next.config.
  2. استثناء /api/* (يستخدمه halaqat-tahfeez نفسه عبر /api/link/summary
     ولازم يبقى شغّالاً) نمط موثّق ومجرَّب بمُطابِق middleware، ولا يحتاج
     تعداد كل صفحة بالتطبيق — أي صفحة أخرى (حالية أو تُضاف لاحقاً) تتحوّل
     تلقائياً بلا تحديث هذا الملف.
*/

const NEW_APP_ORIGIN = "https://halaqat-tahfeez.vercel.app";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const invite = searchParams.get("invite");
  const destinationPath =
    pathname === "/" && invite ? `/student-join?invite=${encodeURIComponent(invite)}` : "/student";

  return NextResponse.redirect(new URL(destinationPath, NEW_APP_ORIGIN), 308);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
