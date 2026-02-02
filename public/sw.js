self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('iijn-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/_next/static/css/app/layout.css',
        '/_next/static/chunks/webpack.js',
        '/_next/static/chunks/main-app.js',
        '/_next/static/chunks/app/_not-found.js',
        '/_next/static/chunks/app/page.js',
        '/_next/static/chunks/app/layout.js',
        '/api/cases',
        '/api/auth/session'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open('iijn-v1').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'iijn-v1') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});