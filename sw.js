// Bump version to v2 to force mobile WebView cache refresh
const CACHE_NAME = 'void-runner-v2';

// All local assets to cache for offline play
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './game.js',
    './image_0.png',
    './image_1.png',
    './manifest.json'
];

// 1. Install Event: Cache all game resources locally
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all game assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 2. Activate Event: Clean up old caches if updated
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// 3. Fetch Event: Serve cached assets directly when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached version if found, otherwise try network
            return cachedResponse || fetch(event.request).catch(() => {
                // Fail-safe fallback if network fails
                return caches.match('./index.html');
            });
        })
    );
});