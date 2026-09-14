// public/sw.js - Service Worker para PROSPECCIÓN OBS
const CACHE_NAME = 'prospeccion-obs-v3';
const RECURSOS_ESTATICOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './logo.png'
];

// 1. Instalar y precargar archivos base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(RECURSOS_ESTATICOS);
    })
  );
  self.skipWaiting();
});

// 2. Limpiar versiones viejas del cache
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
    })
  );
  self.clients.claim();
});

// 3. Interceptar peticiones (Carga instantánea offline sin tocar Supabase ni mapas)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NO interceptar peticiones a Supabase ni mapas satelitales (esas se gestionan en la app)
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('nominatim') ||
    url.hostname.includes('komoot') ||
    url.hostname.includes('tile.openstreetmap.org')
  ) {
    return;
  }

  // Estrategia Stale-While-Revalidate: Responde de inmediato desde el cache y actualiza de fondo
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});