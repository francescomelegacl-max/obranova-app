// Service Worker disabilitato
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});
```

Salva (`Ctrl+S`), poi in CMD:
```
git add .
git commit -m "fix: sw.js unregister definitivo"
git push