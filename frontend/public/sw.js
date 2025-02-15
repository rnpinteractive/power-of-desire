// public/sw.js

const CACHE_NAME = "power-of-desire-v1";
const DYNAMIC_CACHE_NAME = "power-of-desire-dynamic-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/images/content/logopfd-removebg-preview.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper to check if request is for API
const isApiRequest = (url) => {
  return url.includes("/api/");
};

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      const fetchRequest = event.request.clone();

      // Handle API requests
      if (isApiRequest(fetchRequest.url)) {
        return fetch(fetchRequest)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            if (event.request.url.includes("/api/auth/login")) {
              return new Response(
                JSON.stringify({
                  error: "You are offline. Please check your connection.",
                }),
                {
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
          });
      }

      // Regular fetch for other requests
      return fetch(fetchRequest).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      self.registration.showNotification("Power of Desire", options)
    );
  }
});
