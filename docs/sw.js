// AyurAI Service Worker — cache-first for app shell, network-only for OpenAI
const CACHE = 'ayurai-20260414-215633';
const SHELL = ['./', './index.html', './favicon.svg', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Never cache OpenAI API calls — always go to network
  if (e.request.url.includes('openai.com')) return;
  // Cache-first for everything else (app shell, fonts, icons)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
