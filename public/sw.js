const CACHE_NAME = "obp-pwa-v2";
const IS_LOCALHOST =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";
const STATIC_ASSETS = [
  "/offline",
  "/assets/logo-main.jpg",
  "/assets/logo-square.jpg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache private/auth/admin/supplier API responses
  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/admin") ||
    url.pathname.startsWith("/api/supplier") ||
    url.pathname.startsWith("/api/offers")
  ) {
    return;
  }

  // Public catalog API: Network-First with cache fallback for spotty workshop connections
  if (url.pathname.startsWith("/api/catalog")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests: Network-First -> Cache -> /offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match("/offline");
        })
    );
    return;
  }

  // On localhost development, skip caching Next.js dev chunks & pages so hot-reload never serves stale bundles
  if (IS_LOCALHOST) {
    if (request.mode === "navigate") {
      event.respondWith(
        fetch(request).catch(() => caches.match("/offline"))
      );
    }
    return;
  }

  // Static assets (_next/static, icons, assets): Stale-While-Revalidate (production)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});

// Web Push & Local Notification Handlers
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "OtoBeyinPazari.com";
  const options = {
    body: data.body || "Yeni bir talep veya sipariş bildiriminiz var.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/favicon-32x32.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
