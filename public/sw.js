/* عامل الخدمة لإشعارات ورد الطالب — يستقبل الدفع ويعرض الإشعار */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "ورد الطالب";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      dir: "rtl",
      lang: "ar",
      tag: data.tag || "tasjeel",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
