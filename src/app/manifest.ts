import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "아장아장 | 우리 아이 첫 번째 학습 친구",
    short_name: "아장아장",
    description: "아이의 성장을 함께하는 AI 기반 유아 학습 플랫폼",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF5FB",
    theme_color: "#EC4899",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
