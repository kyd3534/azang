/**
 * 아장아장 Service Worker
 * - network-first: 항상 서버에서 최신 버전 가져오기
 * - 새 SW 활성화되면 즉시 모든 클라이언트 새로고침
 */

const CACHE_NAME = "azang-v1";

// 설치 즉시 활성화 (대기 없이 바로 교체)
self.addEventListener("install", () => {
  self.skipWaiting();
});

// 활성화 시 이전 캐시 삭제 + 모든 탭 즉시 제어
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );

  // 새 버전으로 교체됐음을 모든 클라이언트에 알림 → 자동 새로고침
  self.clients.matchAll({ type: "window" }).then((clients) => {
    clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
  });
});

// network-first: 네트워크 우선, 실패 시 캐시 폴백
self.addEventListener("fetch", (event) => {
  // POST, chrome-extension 등은 무시
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  // API, Supabase 요청은 캐시하지 않음
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase") ||
    url.hostname.includes("elevenlabs") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 정적 에셋만 캐시 저장
        if (
          response.ok &&
          (url.pathname.startsWith("/_next/static/") ||
            url.pathname.startsWith("/icons/") ||
            url.pathname === "/logo.png")
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
