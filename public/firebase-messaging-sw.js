// ─── public/firebase-messaging-sw.js ─────────────────────────────────────────
// Service Worker per FCM Push Notifications — Obra Nova SPA
// Deve stare in /public/ (root del sito) per avere scope completo.
// NON importare moduli ES — usa importScripts (ambiente SW).
// ─────────────────────────────────────────────────────────────────────────────

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// ── Config Firebase (stessa dell'app — hardcoded perché il SW non ha accesso a env) ──
firebase.initializeApp({
  apiKey:            "AIzaSyCkVFz7Px7TyN0laC6k3Khvm82QqVXE034",          // verrà sostituito con il valore reale
  authDomain:        "obra-nova-spa.firebaseapp.com",
  projectId:         "obra-nova-spa",
  storageBucket:     "obra-nova-spa.appspot.com",
  messagingSenderId: "836523248614",         // verrà sostituito
  appId:             "1:836523248614:web:f83ef04cfad8be31ece427",            // verrà sostituito
});

const messaging = firebase.messaging();

// ── Notifica in background (app chiusa o non in focus) ────────────────────────
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, tag, url } = payload.notification || payload.data || {};

  self.registration.showNotification(title || "Obra Nova", {
    body:    body    || "",
    icon:    icon    || "/icons/icon-192.png",
    badge:              "/icons/icon-192.png",
    tag:     tag     || "obranova-push",
    data:  { url:  url || "/" },
    vibrate: [200, 100, 200],
    actions: url ? [{ action: "open", title: "Ver" }] : [],
  });
});

// ── Click sulla notifica → apri/focus la pagina ───────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Se c'è già una finestra aperta con quella URL, portala in focus
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // Altrimenti apri una nuova finestra
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
