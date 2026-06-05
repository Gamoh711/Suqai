const CACHE = "suqai-v1"
const STATIC_ASSETS = ["/", "/manifest.json", "/icons/icon-192.svg", "/icons/icon-512.svg"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("fetch", (event: any) => {
  if (event.request.method !== "GET") return
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.ok) {
          caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
        }
        return response
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
})

export {}
