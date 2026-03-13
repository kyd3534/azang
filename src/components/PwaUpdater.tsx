"use client";

import { useEffect } from "react";

export default function PwaUpdater() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    // SW가 새 버전으로 교체됐을 때 자동 새로고침
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SW_UPDATED") {
        window.location.reload();
      }
    });
  }, []);

  return null;
}
