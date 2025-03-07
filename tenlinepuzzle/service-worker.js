self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("app-cache")
      .then((cache) =>
        cache.addAll([
          "index.html",
          "game.js",
          "get_score.mp3",
          "icon_naver_blog.png",
        ])
      )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
