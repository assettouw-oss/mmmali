// Service worker MMMali : réseau d'abord, copie en cache si la connexion tombe.
const V = "mmmali-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return; // Supabase et WhatsApp ne sont jamais mis en cache
  e.respondWith(
    fetch(r)
      .then((res) => { const c = res.clone(); caches.open(V).then((ca) => ca.put(r, c)); return res; })
      .catch(() => caches.match(r).then((m) => m || caches.match("/")))
  );
});
