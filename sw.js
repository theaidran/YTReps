const CACHE_NAME = 'ela-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/reps.html',
  '/styles.css',
  '/reps.css',
  '/script.js',
  '/reps.js',
  '/stats.js',
  '/translations.js',
  '/algorithms.js',
  '/synchronization.js',
  '/icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/desktop.png',
  '/mobile.png'
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Obsługa żądań
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Aktualizacja Service Workera
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 