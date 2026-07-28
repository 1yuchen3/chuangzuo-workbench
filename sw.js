// 创作工作台 PWA Service Worker —— 离线缓存
const CACHE = 'workbench-v1';
const ASSETS = ['./index.html', './data.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(ASSETS); } catch (err) { console.warn('SW precache 部分失败，已忽略：', err); }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 网络优先、失败回退缓存：保证 data.js 热点数据尽量新，断网也能打开
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
