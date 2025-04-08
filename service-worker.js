const CACHE_NAME = 'favari-cache-v7';
const EXCLUDE_FROM_CACHE = [
    "https://docs.google.com/spreadsheets/d/1Avj1eAXQSSAIoMQrUOu7HuIkqwD8McU5v2VRWIO6nS0/export?format=csv",
    "https://docs.google.com/spreadsheets/d/1hPLssEGyjtFCH15axqjy9aALPUkttOPcsZUjK0n5VEU/export?format=csv"
];

// Install event to cache the pages and assets
self.addEventListener('install', (event) => {
    console.log('Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            const urlsToCache = [
                '/',
                '/index.html',
                '/pages/items.html',
                '/pages/single-item.html',
                '/styles.css',
                '/main.js',
                '/images/logo.webp',
                'js/index.js',
                'js/items.js',
                'js/single-item.js',
            ];

            return cache.addAll(urlsToCache)
                .then(() => {
                    console.log('All files are cached');
                })
                .catch((error) => {
                    console.error('Failed to cache: ', error);
                });
        })
    );
});

// Activate event to clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];  // Only keep the new cache

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete caches that are not in the whitelist (old caches)
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Once the old caches are cleared, take control of the page
            return self.clients.claim();
        })
    );
});


// Fetch event to serve cached resources and cache new ones
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Check if the requested URL is one of the pages that require parameter removal
    const shouldNormalizeUrl = ['/pages/items.html', '/pages/single-item.html'].includes(url.pathname);

    // Normalize the URL by removing parameters only for these specific pages
    const urlWithoutParams = shouldNormalizeUrl ? url.origin + url.pathname : url.href;

    // Normalize the URLs in EXCLUDE_FROM_CACHE to avoid mismatches (strip query parameters, etc.)
    const normalizedExcludeUrls = EXCLUDE_FROM_CACHE.map(excludedUrl => new URL(excludedUrl).origin + new URL(excludedUrl).pathname);

    // Skip caching for excluded URLs
    if (normalizedExcludeUrls.includes(url.origin + url.pathname)) {
        event.respondWith(fetch(event.request)); // Fetch directly from network and don't cache
        return;
    }

    // Cache the page without URL parameters if necessary
    event.respondWith(
        caches.match(urlWithoutParams).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Return cached response if available
            }

            // Fetch from network if not cached
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const clonedResponse = networkResponse.clone(); // Clone the response for caching
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(urlWithoutParams, clonedResponse); // Cache the normalized URL
                    });
                }
                return networkResponse; // Return the original network response
            });
        })
    );
});

// Listen for messages from the main thread to update the cache
self.addEventListener('message', (event) => {
    if (event.data.action === 'update-cache') {
        console.log('Triggering cache update...');
        caches.open(CACHE_NAME).then((cache) => {
            // Re-cache all the necessary URLs
            const urlsToCache = [
                '/',
                '/index.html',
                '/pages/items.html',
                '/pages/single-item.html',
                '/styles.css',
                '/main.js',
                '/images/logo.webp',
                'js/index.js',
                'js/items.js',
                'js/single-item.js',
            ];

            cache.addAll(urlsToCache).then(() => {
                console.log('Cache updated successfully.');
            }).catch((error) => {
                console.error('Failed to update cache: ', error);
            });
        });

        // Clean up old caches
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete caches that are not the current cache
                    if (cacheName !== CACHE_NAME) {
                        console.log(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Old caches deleted successfully.');
        }).catch((error) => {
            console.error('Failed to delete old caches: ', error);
        });
    }
});
