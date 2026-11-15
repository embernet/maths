/**
 * sw.js — Service Worker for Mathematics Companion.
 *
 * Strategy: stale-while-revalidate for all cached resources.
 * Caches the app shell on install, then caches each visited page.
 *
 * BUMP THE CACHE_NAME on every deploy that changes shared assets (CSS, JS,
 * service-worker behaviour). Old caches are cleared in the `activate` event
 * for any cache whose name does not match the current CACHE_NAME.
 */

const CACHE_NAME = 'maths-companion-v4';

// Deployment base path (served under a sub-path). This file is static (not
// processed by Vite), so the base is hard-coded here. Keep in sync with BASE
// in src/lib/site-config.mjs. The service worker is served at `${BASE}/sw.js`
// and therefore scoped to `${BASE}/`.
const BASE = '/maths';

/** Core app-shell assets to pre-cache on install. */
const APP_SHELL = [
  `${BASE}/`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/api/index.json`,
];

// ---- Install: cache app shell ----------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {
        // Some shell assets may not exist yet at install time — fail silently.
      })
    )
  );
  self.skipWaiting();
});

// ---- Activate: clean up old caches -----------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---- Fetch: stale-while-revalidate -----------------------------------
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests.
  if (event.request.method !== 'GET') return;

  // Let browser handle chrome-extension and non-http requests.
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful same-origin responses (and opaque CDN ones).
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // Network unavailable — fall back to cache.
          return cached;
        });

      // Return cached immediately if available; update in background.
      return cached ?? fetchPromise;
    })
  );
});
