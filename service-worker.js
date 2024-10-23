	// Cache name (consider versioning to help with updates)
  const CACHE_NAME = 'tewFA-cache-v1.1';

  // Files to cache
  const FILES_TO_CACHE = [
    'index.html',
    'service-worker.js',
    'app.js',
    'styles.css'
  ];
  
  // Install event
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(FILES_TO_CACHE);
      })
    );
    self.skipWaiting(); // Activate the service worker immediately after installation
  });
  
  // Activate event - for cleaning up old caches
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              // Delete old caches
              return caches.delete(cache);
            }
          })
        );
      })
    );
    self.clients.claim(); // Take control of the page immediately
  });
  
  // Fetch event - network-first approach
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If the network response is successful, update the cache
          if (networkResponse && networkResponse.ok) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse; // Return the fresh network response
            });
          }
        })
        .catch(() => {
          // If the network fails, serve from cache
          return caches.match(event.request).then((response) => {
            return response || fetch(event.request); // Return cached version or attempt another fetch
          });
        })
    );
  });