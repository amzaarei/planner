// ════════════════ سرویس‌ورکر دستیار روزم ════════════════
// مهم: هر بار نسخه‌ی اپ رو عوض کردی، فقط همین یک خط زیر رو هم به همون شماره به‌روز کن.
// این کلید تشخیص آپدیته؛ اگه عوض نشه، اعلان نسخه‌ی جدید نمیاد.
const VERSION = '9.4';

const CACHE = 'planner-cache-v' + VERSION;
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// نصب: فایل‌های اصلی رو کش کن (skipWaiting صدا زده نمی‌شه تا کاربر خودش دکمه‌ی آپدیت رو بزنه)
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).catch(function () {})
  );
});

// فعال‌سازی: کش‌های قدیمی رو پاک کن
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// پیام از صفحه: وقتی کاربر دکمه‌ی به‌روزرسانی رو زد
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// واکشی: اول از کش، بعد شبکه (و نتیجه‌ی موفق رو هم کش کن)
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // درخواست‌های گوگل (لاگین و درایو) هیچ‌وقت کش نمی‌شن، مستقیم می‌رن شبکه
  if (/googleapis\.com|accounts\.google\.com|gstatic\.com\/gsi|google\.com\/gsi/.test(url.href)) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      var fetched = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      }).catch(function () { return cached; });
      return cached || fetched;
    })
  );
});
