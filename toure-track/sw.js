const CACHE_NAME = 'toure-track-v6';
const ASSETS = [
    './',
    './index.html',
    './colis.html',
    './camionnettes.html',
    './employes.html',
    './parametres.html',
    './suivi.html',
    './chauffeurs.html',
    './connexion.html',
    './css/style.css',
    './js/supabase-client.js',
    './manifest.json',
    './assets/logo-toure-track.svg',
    './assets/logo-toure-track-sidebar.svg',
    './assets/app-icon.svg',
    './assets/app-icon-180.png',
    './assets/app-icon-192.png',
    './assets/app-icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('toure-track-') && cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

    if (event.request.mode === 'navigate') {
        const navigationResponse = fetch(event.request).then(async response => {
            if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, response.clone());
            }
            return response;
        }).catch(async () => {
            const cachedPage = await caches.match(event.request);
            return cachedPage || caches.match('./index.html');
        });

        event.respondWith(navigationResponse);
        return;
    }

    const cachedResponse = caches.match(event.request);
    const networkResponse = fetch(event.request).then(async response => {
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
        }
        return response;
    }).catch(async () => (await cachedResponse) || undefined);

    event.waitUntil(networkResponse.then(() => undefined));
    event.respondWith(cachedResponse.then(response => response || networkResponse));
});
