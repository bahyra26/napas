/**
 * NAPAS Service Worker (PWA Core - v2)
 * 
 * Fitur:
 * 1. App Shell Pre-caching untuk aset statis inti
 * 2. Auto-Upgrade & Cache Purging (Menghindari stale cache saat ada update baru)
 * 3. Network-First untuk Navigasi HTML (Memastikan aplikasi selalu memuat versi terbaru)
 * 4. Stale-While-Revalidate untuk static assets (CSS, JS, Fonts, Images)
 * 5. Offline-First Resilience (Aplikasi tetap berfungsi saat internet mati)
 */

const CACHE_NAME = 'napas-pwa-v2';
const STATIC_ASSETS = [
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

// 1. INSTALL EVENT: Pre-cache static assets & skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW v2] Pre-cache skip for ${url}:`, err);
          })
        )
      );
    })
  );
});

// 2. ACTIVATE EVENT: Bersihkan cache versi lama & klaim semua tab aktif
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[SW v2] Menghapus cache usang: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. MESSAGE EVENT: Listener manual untuk pembaruan instan
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. FETCH EVENT: Strategi Caching Pintar
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Hanya proses HTTP(S) GET request
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Abaikan WebSocket atau internal extension
  if (url.protocol.startsWith('ws') || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // A. NAVIGASI HALAMAN HTML (Network First -> Cache Fallback -> Offline Page)
  // Menjamin user selalu mendapatkan index.html terbaru dengan hash JS/CSS terkini
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

        // Jika URL memiliki hash bundle (seperti /assets/index-*.js), safe to use cache
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
