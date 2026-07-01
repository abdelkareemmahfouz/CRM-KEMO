const CACHE_NAME = 'mini-crm-cache-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// تثبيت: تخزين الصفحات الأساسية للعمل بدون إنترنت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// تفعيل: حذف أي كاش قديم من نسخة سابقة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// الجلب: أي طلب لباك اند Google Apps Script يروح للنت مباشرة (Network First)
// وأي ملف من التطبيق نفسه (App Shell) بنجيبه من الكاش لو النت مقطوع (Cache First)
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (url.includes('script.google.com')) {
    // بيانات لايف دائمًا من النت، مفيش كاش لبيانات العملاء
    event.respondWith(fetch(event.request).catch(() => 
      new Response(JSON.stringify({ ok:false, message:'لا يوجد اتصال بالإنترنت حاليًا' }), 
        { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => cached);
    })
  );
});
