const CACHE = 'wayfare-content-v1';

const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/data/decks/church-culture.json',
  '/data/decks/courage.json',
  '/data/decks/identity.json',
  '/data/decks/outing-mixed.json',
  '/data/decks/serving.json',
  '/data/decks/the-journey.json',
  '/data/decks/wisdom-tales.json',
  '/data/learn/books.json',
  '/data/learn/lessons.json',
  '/data/learn/quiz.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response.ok) return response;
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('/'));
    }),
  );
});
