/* TheSlap – Service Worker: Mitteilungen auf dem Sperr- und Startbildschirm (auch wenn die App zu ist) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const BADGE = '/__slap_badge__';
async function bumpBadge() {
  try {
    const c = await caches.open('slap-badge'), r = await c.match(BADGE), n = (r ? +(await r.text()) || 0 : 0) + 1;
    await c.put(BADGE, new Response(String(n)));
    if (self.navigator && self.navigator.setAppBadge) await self.navigator.setAppBadge(n);
  } catch (_) { /* egal */ }
}
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'clearBadge') e.waitUntil(caches.open('slap-badge').then(c => c.delete(BADGE)).catch(() => {}));
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const icon = new URL('logo.png', self.registration.scope).href;
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || 'TheSlap', { body: d.body || 'Es gibt was Neues!', icon, badge: icon, tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || '' } }),
    bumpBadge()
  ]));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if ('focus' in c) { c.postMessage({ type: 'open', url }); return c.focus(); }
    return self.clients.openWindow ? self.clients.openWindow(new URL('./' + url, self.registration.scope).href) : null;
  }));
});
