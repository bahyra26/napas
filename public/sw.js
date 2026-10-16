/**
 * NAPAS Service Worker (PWA Core)
 * 
 * Fitur:
 * 1. App Shell Pre-caching untuk loading instan
 * 2. Offline-First Resilience (Aplikasi tetap terbuka & responsif saat internet mati)
 * 3. Stale-While-Revalidate untuk static assets (CSS, JS, Fonts, Images)
 * 4. Background Sync & Cache Purging
 */

const CACHE_NAME = 'napas-pwa-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/napas_icon.svg',
  './icon-192.png',
  './icon-512.png',
  './assets/logo_brain.png',
  './assets/lungs.png',
  './assets/Background.png',
  './assets/Meditasi.png',
  './assets/google.png'
];

// 1. INSTALL EVENT: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache core shell, ignore individual asset failure if any
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] Pre-cache skip for ${url}:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE EVENT: Bersihkan cache versi lama & klaim client
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT: Strategi Caching Pintar
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Hanya proses HTTP(S) GET request
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Abaikan WebSocket atau internal extension
  if (url.protocol.startsWith('ws') || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // A. NAVIGASI HALAMAN HTML (App Shell Strategy: Network First -> Cache Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallbackShell = await caches.match('./index.html') || await caches.match('./');
          if (fallbackShell) return fallbackShell;
          return new Response(
            `<!DOCTYPE html>
            <html lang="id">
            <head><meta charset="UTF-8"><title>NAPAS Offline</title>
            <style>body{background:#0a5445;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;}</style>
            </head>
            <body>
              <div>
                <h2>🌱 NAPAS Sedang Offline</h2>
                <p>Koneksi internet Anda terputus. Silakan hubungkan kembali internet untuk menyinkronkan data.</p>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // B. STATIC ASSETS (JS, CSS, Gambar, Font): Stale-While-Revalidate
  const isStatic =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?|ttf|ico|webp)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. API & SUPABASE CALLS: Network First dengan graceful fallback
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'offline', message: 'Anda sedang offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // D. DEFAULT: Coba network, fallback ke cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
