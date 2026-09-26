// 雞腿換駕照 service worker：網頁優先抓最新版，沒網路時用快取
const CACHE = 'jitui-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const save = res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
  if (url.origin === location.origin) {
    // 自己的檔案：先抓網路（部署新版後馬上看得到），失敗才用快取
    e.respondWith(fetch(req).then(save).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // 字型：先用快取
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(save)));
  }
});
