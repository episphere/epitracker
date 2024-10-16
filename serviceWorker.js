importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

workbox.setConfig({debug: false})
const { ExpirationPlugin } = workbox.expiration;
const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponse, CacheableResponsePlugin } = workbox.cacheableResponse;
const googleAnalytics = workbox.googleAnalytics;
googleAnalytics.initialize();
registerRoute(/\.(?:js|css|woff2)$/, new NetworkFirst({cacheName: 'static-cache'}));
// Need a way to version to detect when NOT to stay statically cached.
registerRoute(new RegExp('https://fonts.googleapis.com/.+'), new StaleWhileRevalidate({cacheName: 'static-cache'}));
registerRoute(new RegExp('https:.*min\.(css|js)'), new CacheFirst({cacheName: 'static-cache'}));
registerRoute(/\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
    new CacheFirst({
        cacheName: 'images-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 0,
            })
        ]
    })
);

workbox.precaching.precacheAndRoute([
        {url: 'index.html', revision: '100001'},
        {url: 'src/pages/homePage.js', revision: '100001'}
    ]
);
