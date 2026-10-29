const CACHE_NAME = 'abril-verde-ar-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/dds-hoje.json',
  '/aframe.min.js',
  '/mindar-image-aframe.prod.js',
  '/targets.mind',
  '/checklist.png',
  '/simbolo.PNG',
  '/label-dds.png',
  '/cartaz.png',
  '/audio.m4a',
  '/models/capacete.glb',
  '/models/protetor.glb',
  '/models/oculos.glb',
  '/models/laco-3d.glb'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network-first for dynamic dds-hoje.json, fallback to cache offline
  if (event.request.url.includes('/dds-hoje.json')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first with background revalidation for heavy AR assets & bundles
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
