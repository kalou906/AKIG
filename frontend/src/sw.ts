/**
 * Service Worker pour AKIG
 * - Stratégie cache-first pour assets statiques
 * - Stratégie network-first pour API
 * - Synchronisation en arrière-plan
 */

// @ts-ignore - Types DOM pour Service Worker
declare const self: any;

// Version du cache
const CACHE_VERSION = 'akig-v1';
const CACHE_ASSETS = `${CACHE_VERSION}:assets`;
const CACHE_API = `${CACHE_VERSION}:api`;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
];

// Installation du Service Worker
self.addEventListener('install', (event: any) => {
  console.log('[SW] Install event');
  event.waitUntil(
    (async () => {
      try {
        // Ouvrir les caches
        const assetsCache = await caches.open(CACHE_ASSETS);
        const apiCache = await caches.open(CACHE_API);

        // Mettre en cache les assets statiques
        await assetsCache.addAll(STATIC_ASSETS);

        // Forcer le Service Worker à prendre le contrôle immédiatement
        await (self as any).skipWaiting();
      } catch (error) {
        console.error('[SW] Install error:', error);
      }
    })()
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event: any) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    (async () => {
      try {
        // Nettoyer les anciens caches
        const cacheNames = await caches.keys();
        const cachesToDelete = cacheNames.filter(
          (name) => !name.startsWith(CACHE_VERSION)
        );

        await Promise.all(cachesToDelete.map((name) => caches.delete(name)));

        // Prendre le contrôle de tous les clients
        await (self as any).clients.claim();
      } catch (error) {
        console.error('[SW] Activate error:', error);
      }
    })()
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignorer les requêtes vers des domaines externes
  if (url.origin !== (self as any).location.origin) return;

  // Stratégie pour les requêtes API
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request));
  }
  // Stratégie pour les assets statiques
  else {
    event.respondWith(cacheFirstStrategy(request));
  }
});

/**
 * Cache-first strategy - Utiliser le cache en priorité
 * Fallback sur le réseau si pas en cache
 */
async function cacheFirstStrategy(request: any): Promise<Response> {
  try {
    // Chercher dans le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    // Récupérer du réseau
    console.log('[SW] Fetching:', request.url);
    const networkResponse = await fetch(request);

    // Mettre en cache si la réponse est valide
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_ASSETS);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first error:', error);
    // Retourner une réponse d'erreur offline
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network-first strategy - Utiliser le réseau en priorité
 * Fallback sur le cache si offline
 */
async function networkFirstStrategy(request: any): Promise<Response> {
  try {
    // Essayer le réseau d'abord
    console.log('[SW] Network request:', request.url);
    const networkResponse = await fetch(request);

    // Mettre en cache les réponses réussies
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_API);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Fallback sur le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Réponse par défaut offline
    return new Response(
      JSON.stringify({
        error: 'Network error - Please check your connection',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Synchronisation en arrière-plan
 * (Optionnel: utiliser pour synchroniser les changements offline)
 */
self.addEventListener('sync', (event: any) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-updates') {
    event.waitUntil(
      (async () => {
        // Ici, ajouter la logique de synchronisation
        console.log('[SW] Syncing offline updates...');
      })()
    );
  }
});

/**
 * Notifications push
 * (Optionnel: pour les notifications)
 */
self.addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'AKIG';
  const options = {
    body: data.body || 'Vous avez une nouvelle notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'akig-notification',
    data: data.data || {},
  };

  event.waitUntil(
    (self as any).registration.showNotification(title, options)
  );
});
