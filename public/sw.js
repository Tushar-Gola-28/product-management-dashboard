const CACHE_VERSION = "v1";

const IMAGE_CACHE = `image-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;

const MAX_ITEMS = 300;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ----------------------------
// Utility: Limit cache size
// ----------------------------
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
        await cache.delete(keys[0]);
        await limitCacheSize(cacheName, maxItems);
    }
}

// ----------------------------
// Utility: Clean expired cache
// ----------------------------
async function cleanOldEntries(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();

    for (const key of keys) {
        const response = await cache.match(key);

        const dateHeader = response?.headers?.get("date");
        if (dateHeader) {
            const age = now - new Date(dateHeader).getTime();
            if (age > CACHE_TTL) {
                await cache.delete(key);
            }
        }
    }
}

// ----------------------------
// INSTALL
// ----------------------------
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll([
                "/",
                "/index.html",
                "/offline.html",
                "/half_logo.svg",
                "/logo.svg",
            ]);
        })
    );

    self.skipWaiting();
});

// ----------------------------
// FETCH HANDLER
// ----------------------------
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // ============================
    // ✅ IMAGE CACHING
    // stale-while-revalidate
    // ============================
    if (event.request.destination === "image") {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(async (cache) => {
                const cached = await cache.match(event.request);

                if (cached) {
                    // Background refresh
                    event.waitUntil(
                        fetch(event.request)
                            .then((fresh) => {
                                if (fresh && fresh.status === 200) {
                                    cache.put(event.request, fresh.clone());
                                    cleanOldEntries(IMAGE_CACHE);
                                }
                            })
                            .catch(() => { })
                    );

                    return cached;
                }

                // Not cached → fetch and store
                return fetch(event.request)
                    .then((response) => {
                        if (response && response.status === 200) {
                            cache.put(event.request, response.clone());
                            limitCacheSize(IMAGE_CACHE, MAX_ITEMS);
                        }
                        return response;
                    })
                    .catch(() => new Response(null, { status: 404 }));
            })
        );

        return;
    }

    // ============================
    // ✅ API CACHING (GET only)
    // Cache First + Background Update
    // ============================
    if (event.request.method === "GET" && url.origin === self.location.origin || url.origin.includes("dummyjson.com")) {
        event.respondWith(
            caches.open(API_CACHE).then(async (cache) => {
                const cached = await cache.match(event.request);

                // Try network in background
                const networkFetch = fetch(event.request)
                    .then((response) => {
                        if (response && response.status === 200) {
                            cache.put(event.request, response.clone());
                            limitCacheSize(API_CACHE, MAX_ITEMS);
                        }
                        return response;
                    })
                    .catch(() => null);

                // Serve cached first (fast)
                if (cached) {
                    event.waitUntil(networkFetch);
                    return cached;
                }

                // No cache, wait for network
                const fresh = await networkFetch;

                if (fresh) return fresh;

                // Offline fallback
                return new Response(
                    JSON.stringify({ error: "Offline mode: no cached data available" }),
                    {
                        headers: { "Content-Type": "application/json" },
                        status: 503,
                    }
                );
            })
        );

        return;
    }

    // ============================
    // ✅ STATIC FILES (HTML pages)
    // Network first fallback to cache
    // ============================
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(async () => {
                    const cache = await caches.open(STATIC_CACHE);
                    const cached = await cache.match(event.request);
                    return cached || (await cache.match("/offline.html"));
                })
        );

        return;
    }

    // ============================
    // Default: Try cache then network
    // ============================
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return (
                cached ||
                fetch(event.request).catch(() => new Response("Offline", { status: 503 }))
            );
        })
    );
});

// ----------------------------
// ACTIVATE
// ----------------------------
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter(
                        (key) =>
                            (key.startsWith("image-cache-") ||
                                key.startsWith("api-cache-") ||
                                key.startsWith("static-cache-")) &&
                            ![IMAGE_CACHE, API_CACHE, STATIC_CACHE].includes(key)
                    )
                    .map((oldKey) => caches.delete(oldKey))
            )
        )
    );

    self.clients.claim();
});
