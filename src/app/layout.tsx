import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { DevicePreview } from "@/components/dev/DevicePreview";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "아장아장 | 우리 아이 첫 번째 학습 친구",
    template: "%s | 아장아장",
  },
  description: "아이의 성장을 함께하는 AI 기반 유아 학습 플랫폼",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "아장아장",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EC4899",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.variable} antialiased`}>
        {process.env.NODE_ENV === 'development' ? (
          <DevicePreview>{children}</DevicePreview>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
