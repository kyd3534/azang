import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { DeviceModeProvider, DevicePreview, DeviceToolbar } from "@/components/dev/DevicePreview";
import PwaUpdater from "@/components/PwaUpdater";
import ClickSound from "@/components/ClickSound";

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
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "아장아장",
    startupImage: "/logo.png",
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
        <PwaUpdater />
        <ClickSound />
        <DeviceModeProvider>
          <DeviceToolbar />
          <DevicePreview>{children}</DevicePreview>
        </DeviceModeProvider>
      </body>
    </html>
  );
}
