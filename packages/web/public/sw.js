const CACHE = "librepair-shell-v2";
const SHELL = [
  "/",
  "/welcome",
  "/manifest-v2.webmanifest",
  "/logo.png",
  "/librepair-favicon-v2-16.png",
  "/librepair-favicon-v2-32.png",
  "/librepair-favicon-v2.ico",
  "/librepair-touch-icon-v2.png",
  "/librepair-icon-v2-192.png",
  "/librepair-icon-v2-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))));
  }
});
