const CACHE_NAME = 'hotel-etuna-v1';
const APP_SHELL = ['/', '/rooms', '/dining', '/tours', '/offline', '/manifest.json'];
const BOOKING_QUEUE_DB = 'hotel-etuna-offline-db';
const BOOKING_STORE = 'bookingQueue';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(BOOKING_QUEUE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOOKING_STORE)) {
        db.createObjectStore(BOOKING_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function queueBooking(payload) {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    tx.objectStore(BOOKING_STORE).add({ payload, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function readQueuedBookings() {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readonly');
    const request = tx.objectStore(BOOKING_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function clearQueuedBookings(ids) {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKING_STORE, 'readwrite');
    for (const id of ids) tx.objectStore(BOOKING_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function replayBookingQueue() {
  const entries = await readQueuedBookings();
  if (!entries.length) return;
  const completedIds = [];
  for (const entry of entries) {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry.payload),
      });
      if (response.ok) completedIds.push(entry.id);
    } catch (_error) {
      // Keep queued for later replay.
    }
  }
  if (completedIds.length) await clearQueuedBookings(completedIds);
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'REPLAY_BOOKINGS') {
    event.waitUntil(replayBookingQueue());
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const isBookingPost = url.pathname === '/api/bookings' && request.method === 'POST';

  if (isBookingPost) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        const payload = await request.clone().json();
        await queueBooking(payload);
        return new Response(
          JSON.stringify({
            queued: true,
            message: 'You are offline. Booking saved locally and will sync automatically.',
          }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (_error) {
        if (request.mode === 'navigate') {
          return caches.match('/offline');
        }
        return new Response('Offline', { status: 503 });
      }
    })
  );
});
