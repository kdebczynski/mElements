const CACHE_NAME = 'cache-and-update';
const STATIC_ASSETS = [
  './index.html',
  './index.bundle.js',
  './assets/',
  './assets/github-logo-128.png',
  './assets/github-logo-512.png',
  './manifest.json'
];

function parseJson(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return undefined;
  }
}

self.addEventListener('install', (event) => {
  console.log('install');

  // forces the waiting service worker to become the active service worker.
  self.skipWaiting();

  // delay install by caching assets and open database
  event.waitUntil(cacheStaticAssets());
});

self.addEventListener('activate', (event) => {
  console.log('activate');

  // allows an active service worker to set itself as the controller for all clients within its scope.
  self.clients.claim();

  // remove old cache and then cache new static assets
  event.waitUntil(caches.delete(CACHE_NAME).then(cacheStaticAssets));
});

self.addEventListener('fetch', (event) => {
  console.log('fetch');

  // respond from cache first
  event.respondWith(fetchFromNetworkFirst(event.request));
});

self.addEventListener('push', () => {
  console.log('push');

  // The Push API gives web applications the ability to receive messages pushed to them from a server,
  // whether or not the web app is in the foreground, or even currently loaded, on a user agent.
});

self.addEventListener('notificationclick', function (event) {
  console.log('notificationclick');

  event.notification.close();
  clients.openWindow(event.notification.data.link);
});

self.addEventListener('sync', (event) => {
  console.log('sync');

  const recievedJsonTag = parseJson(event.tag);

  if (recievedJsonTag && recievedJsonTag.type === 'fetch-sync') {
    const url = recievedJsonTag.url;

    event.waitUntil(
      fetch(url)
        .then(async (response) => {
          const headers = {};
          response.headers.forEach((val, key) => {
            headers[key] = val;
          })

          await updateCache(url, response.clone());

          const data = await response.json();

          self.registration.showNotification(`Background sync finished with success`, { data: { link: recievedJsonTag.link } });

          return sendMessageToAllClients({ jsonTag: event.tag, data, headers });
        })
        .catch(err => {
          if (event.lastChance) {
            self.registration.showNotification(`Can't get ${url}`);
          }
          throw err;
        })
    );
  }
});

async function fetchFromCacheFirst(request) {
  const responseFromCache = await fromCache(request);

  if (!responseFromCache) {
    const response = await fromNetwork(request);

    await updateCache(request, response.clone());

    return response;
  }

  return responseFromCache;
}

async function fetchFromNetworkFirst(request) {
  try {
    const response =  await fromNetwork(request);

    await updateCache(request, response.clone());

    return response;
  } catch(e) {
    const responseFromCache = await fromCache(request);

    if (responseFromCache) {
      return responseFromCache;
    } else {
      throw e;
    }
  }
}

function cacheStaticAssets() {
  return caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
}

function fromCache(request) {
  return caches.open(CACHE_NAME).then((cache) => cache.match(request));
}

function fromNetwork(request) {
  return fetch(request);
}

function updateCache(request, response) {
  return caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
}

function sendMessageToAllClients(msg) {
  return clients.matchAll()
    .then(clients => {
      clients.forEach(client => client.postMessage(msg))
    });
}
