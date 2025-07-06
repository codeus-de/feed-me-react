// Service Worker für PWA - ohne Caching während der Entwicklung
// Dieser Service Worker registriert sich nur, um die PWA-Funktionalität zu ermöglichen
// aber cached keine Inhalte, um Entwicklungsprobleme zu vermeiden

const CACHE_NAME = 'koobi-dev-v1';

// Installiere den Service Worker ohne Caching
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install Event');
  // Skip waiting, damit neue Versionen sofort aktiv werden
  self.skipWaiting();
});

// Aktiviere den Service Worker und lösche alte Caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate Event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Lösche alle alten Caches
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Übernimme sofort die Kontrolle über alle Clients
      return self.clients.claim();
    })
  );
});

// Fetch Event - leite alle Requests direkt an das Netzwerk weiter (kein Caching)
self.addEventListener('fetch', (event) => {
  // Während der Entwicklung: Alle Requests gehen direkt ans Netzwerk
  // Dies verhindert Caching-Probleme während der Entwicklung
  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback falls Netzwerk nicht verfügbar ist
      // Für Entwicklung: Zeige eine einfache Offline-Nachricht
      if (event.request.destination === 'document') {
        return new Response(
          `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Koobi - Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #838383;
                color: #fbfbfb;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .offline-message {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 40px;
                max-width: 400px;
              }
            </style>
          </head>
          <body>
            <div class="offline-message">
              <h1>Koobi</h1>
              <p>Sie sind offline. Bitte überprüfen Sie Ihre Internetverbindung.</p>
              <button onclick="window.location.reload()" style="
                background: #008d38;
                border: none;
                border-radius: 16px;
                padding: 18px 28px;
                color: white;
                font-size: 16px;
                cursor: pointer;
              ">
                Erneut versuchen
              </button>
            </div>
          </body>
          </html>
          `,
          {
            headers: { 'Content-Type': 'text/html' }
          }
        );
      }
    })
  );
});

// Message Event - für Kommunikation mit der App
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
