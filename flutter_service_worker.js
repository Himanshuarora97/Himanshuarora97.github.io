'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "1b70114fbddfe248c6124ee590e863c8",
"index.html": "de82c7c0217bd243445f63f886d7693d",
"/": "de82c7c0217bd243445f63f886d7693d",
"main.dart.js": "1247a3361cd693ab0567e1a697bedb36",
"icons/favicon.ico": "af682a3b8bc01ccc990a03dce12a819c",
"manifest.json": "d6c22c03e048b84ad1132c4f68d92397",
"assets/AssetManifest.json": "15db6691faca64aadbb46d80e8c88652",
"assets/NOTICES": "fd247385d8872624e5351077d431581a",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/packages/calculator/assets/audios/find.mp3": "c421b71ce3dcdf7a68168915e5a0f2da",
"assets/packages/calculator/assets/audios/chort.wav": "b951fbcc5050adbec9f64ddeb8d650a7",
"assets/fonts/MaterialIcons-Regular.otf": "4e6447691c9509f7acdbf8a931a85ca1",
"assets/assets/images/mobile_build.png": "b94324f3afc04be35534aad408022a44",
"assets/assets/images/github.svg": "2177bd04a593dddbc318a41b6470722c",
"assets/assets/images/mail.png": "f907b8940ee0f5fa13578f3f057a634f",
"assets/assets/images/mail.svg": "3855b078b6f1e62ce40e815f187c922a",
"assets/assets/images/profile_color.jpg": "7ee1a10d097973045cbdf9b4866c783f",
"assets/assets/images/weather.png": "9672f063ad36dea2d2565aec8f5b5494",
"assets/assets/images/photos.svg": "3cb1d5aaebb49679f8ff92fabfa30a9f",
"assets/assets/images/camera.svg": "93879dd118b0636bf098d3c6347411fc",
"assets/assets/images/facetime.svg": "86a75515a0eeecabc8f065f0382039ec",
"assets/assets/images/profile.jpg": "124111b0e2967712c72a08258a85bdcf",
"assets/assets/images/clock.png": "9ceba7aacaabb50756def1d50bebd02e",
"assets/assets/images/clock.svg": "885cb15e430960f251a6e1c88b7eb1a8",
"assets/assets/images/bg_wallpaper.png": "0bc563e1a829c47f6e8ff07fa3a65267",
"assets/assets/images/linkedin.svg": "e4eb1a8ff1058fc4e74a1d9818c10ded",
"assets/assets/images/twitter.svg": "68905c594084ab1b6b51e26d6cda1cb1",
"assets/assets/images/calendar.svg": "a4147b04631c68bff7dce6270af3ed3f",
"assets/assets/images/app_store.png": "b2c284e538de7ce8bc2ca8022a1fd743",
"assets/assets/images/maps.png": "b70ddd66869771c5e91617704c18a585"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
