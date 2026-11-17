/* Offline shell for static hosting. The game save stays in localStorage. */
const CACHE = 'touchline-shell-v1';
const FILES = ['./', './index.html', './style.css', './engine.js', './app.js'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('touchline-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
