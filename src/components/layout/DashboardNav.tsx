"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useVoice } from "@/lib/voice-context";
import { LogOut, User, Mic, ShieldCheck } from "lucide-react";

export default function DashboardNav({ nickname, isAdmin = false }: { nickname: string; isAdmin?: boolean }) {
  const router = useRouter();
  useVoice(); // keep context alive

  const headerRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setIsMobile(entry.contentRect.width < 600);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white"
      style={{ borderBottom: "2px solid #DBEAFE", boxShadow: "0 2px 12px rgba(59,130,246,0.08)" }}
    >
      <div className="px-4 sm:px-6">
        {/* 1행: 로고 + 음성 선택 + 데스크탑 우측 버튼 */}
        <div className="h-14 flex items-center justify-between gap-3">
          {/* 로고 */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-sm"
              style={{ background: "linear-gradient(135deg, #DBEAFE, #EDE9FE)" }}
            >
              🌸
            </div>
            <div className="flex items-center gap-1">
              <span className="font-black text-lg" style={{ color: "#1E40AF" }}>아장아장</span>
              <span className="text-base animate-twinkle" style={{ color: "#60A5FA" }}>✨</span>
            </div>
          </Link>

          {/* 우측 버튼 — 데스크탑만 */}
          {!isMobile && (
            <div className="flex items-center gap-0.5 shrink-0">
              {isAdmin && (
                <Link href="/dashboard/admin">
                  <button
                    className="flex items-center gap-1 rounded-full transition-all duration-200 hover:bg-purple-50"
                    style={{ color: "#7C3AED", padding: "6px 10px" }}
                  >
                    <ShieldCheck size={15} />
                    <span className="text-sm font-semibold">관리자</span>
                  </button>
                </Link>
              )}
              <Link href="/voice-profile">
                <button
                  className="flex items-center gap-1 rounded-full transition-all duration-200 hover:bg-pink-50"
                  style={{ color: "#EC4899", padding: "6px 10px" }}
                >
                  <Mic size={15} />
                  <span className="text-sm font-semibold">목소리 설정</span>
                </button>
              </Link>
              <Link href="/profile">
                <button
                  className="flex items-center gap-1 rounded-full transition-all duration-200 hover:bg-blue-50"
                  style={{ color: "#3B82F6", padding: "6px 10px" }}
                >
                  <User size={15} />
                  <span className="text-sm font-semibold">프로필</span>
                </button>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 rounded-full transition-all duration-200 hover:bg-blue-50"
                style={{ color: "#3B82F6", padding: "6px 10px" }}
              >
                <LogOut size={15} />
                <span className="text-sm font-semibold">로그아웃</span>
              </button>
            </div>
          )}
        </div>

        {/* 2행: 모바일 전용 — 버튼 3개 나란히 */}
        {isMobile && (
          <div
            className="flex items-center justify-around py-1.5"
            style={{ borderTop: "1px solid #EFF6FF" }}
          >
            {isAdmin && (
              <>
                <Link href="/dashboard/admin" className="flex-1">
                  <button
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all hover:bg-purple-50"
                    style={{ color: "#7C3AED" }}
                  >
                    <ShieldCheck size={14} />
                    <span className="text-xs font-semibold">관리자</span>
                  </button>
                </Link>
                <div className="w-px h-5 bg-gray-200" />
              </>
            )}
            <Link href="/voice-profile" className="flex-1">
              <button
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all hover:bg-pink-50"
                style={{ color: "#EC4899" }}
              >
                <Mic size={14} />
                <span className="text-xs font-semibold">목소리 설정</span>
              </button>
            </Link>
            <div className="w-px h-5 bg-gray-200" />
            <Link href="/profile" className="flex-1">
              <button
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all hover:bg-blue-50"
                style={{ color: "#3B82F6" }}
              >
                <User size={14} />
                <span className="text-xs font-semibold">프로필</span>
              </button>
            </Link>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={handleSignOut}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all hover:bg-blue-50"
              style={{ color: "#3B82F6" }}
            >
              <LogOut size={14} />
              <span className="text-xs font-semibold">로그아웃</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
