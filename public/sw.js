const CACHE_NAME = 'eclipse-chain-tools-v1'
const urlsToCache = [
  '/',
  '/gas-tracker',
  '/transaction-analyzer',
  '/rpc-monitor',
  '/wallet',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache opened successfully
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip caching for API requests
  if (event.request.url.includes('api/') || 
      event.request.url.includes('rpc.eclipse.xyz') ||
      event.request.url.includes('mainnetbeta-rpc.eclipse.xyz')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })

          return response
        })
      })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // Deleting old cache version
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Push event for notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'New notification from Eclipse Chain Tools',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: data.tag || 'eclipse-notification',
      data: data.data || {},
      actions: data.actions || []
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'Eclipse Chain Tools', options)
    )
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        event.waitUntil(
          clients.openWindow(event.notification.data.url || '/')
        )
        break
      case 'dismiss':
        // Do nothing
        break
    }
  } else {
    // Handle notification click (not action)
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    )
  }
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync
      // Background sync triggered
    )
  }
})

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})