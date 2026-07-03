/* Domatra Skrutky – service worker */
const CACHE = "skrutky-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // Katalóg (gist) – vždy skús sieť, ulož kópiu, offline vráť poslednú uloženú
  if (url.hostname.indexOf("gist.githubusercontent.com") !== -1) {
    e.respondWith(
      fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((ch) => ch.put(req, c)); return r; })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Ostatné (appka, ikony, obrázky skrutiek) – najprv cache, potom sieť, a uloženie do cache
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((r) => {
        if (r.ok && (url.origin === location.origin || url.hostname.indexOf("i.postimg.cc") !== -1)) {
          const c = r.clone(); caches.open(CACHE).then((ch) => ch.put(req, c));
        }
        return r;
      }).catch(() => cached)
    )
  );
});
