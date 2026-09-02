// Minimal pass-through service worker: no caching, just makes the app
// installable (Add to Home Screen) on browsers that require an active
// worker with a fetch handler for the install prompt.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
