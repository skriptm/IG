/* Service Worker: App offline verfügbar machen. Bei jeder Änderung VERSION hochzählen. */
const VERSION = "ig-1.9.0";
const SHELL = ["./", "index.html", "manifest.webmanifest", "css/app.css", "js/config.js", "js/core.js", "js/charts.js",
  "js/modules/home.js", "js/modules/growth.js", "js/modules/content.js", "js/modules/contacts.js", "js/modules/settings.js",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// App-Dateien: erst Netz (frisch), sonst Cache. Daten von Make laufen nie über den Cache.
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then((m) => m || caches.match("index.html"))));
});
