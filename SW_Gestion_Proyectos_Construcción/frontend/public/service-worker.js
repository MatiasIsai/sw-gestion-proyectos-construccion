const CACHE_NAME = 'sigc-cache-v3';
const APP_SHELL = [
  '/src/index.html',
  '/src/css/styles.css',
  '/src/js/main.js',
  '/src/js/ui.js',
  '/src/js/labels.js',
  '/src/js/api/client.js',
  '/src/js/pages/login.js',
  '/src/js/pages/dashboard.js',
  '/src/js/pages/projects.js',
  '/src/js/pages/project-form.js',
  '/src/js/pages/project-detail.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
