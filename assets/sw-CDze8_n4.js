const i="koobi-dev-v1";self.addEventListener("install",e=>{console.log("Service Worker: Install Event"),self.skipWaiting()});self.addEventListener("activate",e=>{console.log("Service Worker: Activate Event"),e.waitUntil(caches.keys().then(n=>Promise.all(n.map(t=>{if(t!==i)return console.log("Service Worker: Clearing Old Cache",t),caches.delete(t)}))).then(()=>self.clients.claim()))});self.addEventListener("fetch",e=>{e.respondWith(fetch(e.request).catch(()=>{if(e.request.destination==="document")return new Response(`
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
          `,{headers:{"Content-Type":"text/html"}})}))});self.addEventListener("message",e=>{e.data&&e.data.type==="SKIP_WAITING"&&self.skipWaiting()});
