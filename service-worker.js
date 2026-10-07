const CACHE = "dailyzodiac-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/zodiac-engine.js",
  "./js/ephemeris.js",
  "./data/signs.json",
  "./data/themes.json",
  "./data/aspects.json",
  "./data/daily-rules.json",
  "./data/relation-statements.json",
  "./data/planet-signs.json",
  "./data/planet-aspects.json",
  "./data/sign-profiles.json",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response && (response.ok || response.type === "opaque")) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
