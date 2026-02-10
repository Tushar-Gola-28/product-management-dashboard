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
        if (!response) continue;

        const dateHeader = response.headers.get("date");
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
                "/offline.html"
            ]);
        })
    );

    self.skipWaiting();
});

// ----------------------------
// FETCH HANDLER
// ----------------------------
self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);



    if (request.method !== "GET") return;

    // 🚫 IMPORTANT: Do not cache JS/CSS module files (prevents MIME error)
    if (request.destination === "script" || request.destination === "style") {
        event.respondWith(fetch(request).catch(() => caches.match(request)));
        return;
    }

    const isImageRequest =
        request.destination === "image" ||
        url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);

    if (isImageRequest) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(async (cache) => {
                const cached = await cache.match(event.request);

                if (cached) {
                    event.waitUntil(
                        fetch(event.request)
                            .then((fresh) => {
                                cache.put(event.request, fresh.clone());
                                cleanOldEntries(IMAGE_CACHE);
                            })
                            .catch(() => { })
                    );
                    return cached;
                }

                // Not cached → fetch + store
                return fetch(event.request)
                    .then((response) => {
                        cache.put(event.request, response.clone());
                        limitCacheSize(IMAGE_CACHE, MAX_ITEMS);
                        return response;
                    })
                    .catch(() => new Response(null, { status: 404 }));
            })
        );

        return;
    }

    const isAPIRequest =
        url.pathname.startsWith("/api") ||
        url.pathname.startsWith("/service") ||
        url.origin.includes("dummyjson.com");

    if (isAPIRequest) {
        event.respondWith(
            caches.open(API_CACHE).then(async (cache) => {
                const cached = await cache.match(request);

                const networkFetch = fetch(request)
                    .then((response) => {
                        // cache only JSON response
                        const type = response.headers.get("content-type") || "";
                        if (response && response.status === 200 && type.includes("application/json")) {
                            cache.put(request, response.clone());
                            limitCacheSize(API_CACHE, MAX_ITEMS);
                        }
                        return response;
                    })
                    .catch(() => null);

                if (cached) {
                    event.waitUntil(networkFetch);
                    return cached;
                }

                const fresh = await networkFetch;
                if (fresh) return fresh;

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
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();

                    // Store only homepage (not every route)
                    caches.open(STATIC_CACHE).then((cache) => cache.put("/", clone));

                    return response;
                })
                .catch(async () => {
                    const cache = await caches.open(STATIC_CACHE);

                    // Try cached homepage
                    const cached = await cache.match("/");
                    return cached || (await cache.match("/offline.html"));
                })
        );

        return;
    }

    // ============================
    // Default: Try cache then network
    // ============================
    event.respondWith(
        caches.match(request).then((cached) => {
            return (
                cached ||
                fetch(request).catch(() => new Response("Offline", { status: 503 }))
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
