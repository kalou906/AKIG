/// <reference lib="webworker" />

/**
 * Service Worker pour PWA
 * - Cache des assets
 * - Notifications push
 * - Offline support
 */

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'solvency-ai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch avec cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Vérifier si réponse valide
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone la réponse
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  let data = {
    title: 'AKIG Solvency Alert',
    message: 'Nouvelle notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.message = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: data.message,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: 'solvency-alert',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Voir',
      },
      {
        action: 'close',
        title: 'Fermer',
      },
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click sur notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  if (event.action === 'view') {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Vérifier si une fenêtre est déjà ouverte
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Sinon, ouvrir une nouvelle fenêtre
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Sync background (pour envoi différé)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(
      // Synchroniser les données en arrière-plan
      fetch('/api/sync').then((response) => {
        console.log('Background sync completed');
      })
    );
  }
});

export {};
