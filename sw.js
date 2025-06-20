const CACHE_NAME = 'universal-scanner-v1';
const urlsToCache = [
  'LS Scanner Auswahl - mit Buttons.html',
  'manifest.json',
  'sw.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  // Fügen Sie hier die Pfade zu Ihren Audio-Dateien hinzu, falls vorhanden
  // 'positive-tone.mp3',
  // 'negative-tone.mp3',
  // Fügen Sie hier Ihre Icon-Dateien hinzu
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Aktiviert den Service Worker sofort
  );
});

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
    }).then(() => self.clients.claim()) // Übernimmt die Kontrolle über alle offenen Clients
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache Hit - returniere die Antwort
        if (response) {
          return response;
        }
        // Kein Cache Hit - fetch von Netzwerk
        return fetch(event.request).then((response) => {
          // Prüfen, ob wir eine gültige Antwort erhalten haben
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Klonen der Antwort, da der Body nur einmal gelesen werden kann
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        }).catch(() => {
          // Falls Netzwerk und Cache fehlschlagen, z.B. Offline-Seite zurückgeben
          // Dies könnte hier angepasst werden, um eine spezifische Offline-Seite zu zeigen
          // Für diesen Scanner ist eine Offline-Funktionalität ohne die PDF-Analyse
          // und API-Anbindung eingeschränkt, aber die statischen Assets werden geladen.
        });
      })
  );
});