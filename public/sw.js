// Minimaler Service Worker, ausschließlich für Web-Push-Erinnerungen (Wasser,
// Fasten-Ende, Mahlzeit, Gewicht) — kein Offline-Caching, damit die App
// weiterhin immer den aktuellsten Stand von GitHub Pages lädt.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'Nellicious', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Nellicious'
  const options = {
    body: payload.body || '',
    icon: '/Nellicious/icon-192.png',
    badge: '/Nellicious/icon-192.png',
    tag: payload.tag,
    data: { url: payload.url || '/Nellicious/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/Nellicious/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
