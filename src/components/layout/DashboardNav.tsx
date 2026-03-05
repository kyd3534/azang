"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useVoice } from "@/lib/voice-context";
import { LogOut, User, Mic } from "lucide-react";

export default function DashboardNav({ nickname }: { nickname: string }) {
  const router = useRouter();
  const { profiles, selectedVoiceId, setSelectedVoiceId, ready } = useVoice();
  const validProfiles = profiles.filter((p) => p.voice_id);

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
      <div className="max-w-5xl mx-auto px-4">
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

          {/* 가운데 — 목소리 아이콘 선택 */}
          {ready && validProfiles.length > 0 && (
            <div className="flex items-center gap-1 flex-1 justify-center">
              <button
                title="기본 목소리"
                onClick={() => setSelectedVoiceId("")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all shrink-0"
                style={{
                  background: !selectedVoiceId ? "#6B7280" : "#F3F4F6",
                  color: !selectedVoiceId ? "white" : "#9CA3AF",
                  boxShadow: !selectedVoiceId ? "0 0 0 2px #6B7280" : "none",
                }}
              >
                🔊
              </button>
              {validProfiles.map((p) => (
                <button
                  key={p.id}
                  title={p.name}
                  onClick={() => setSelectedVoiceId(p.voice_id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0"
                  style={{
                    background: selectedVoiceId === p.voice_id ? "#EC4899" : "#FDF2F8",
                    color: selectedVoiceId === p.voice_id ? "white" : "#EC4899",
                    boxShadow: selectedVoiceId === p.voice_id ? "0 0 0 2px #EC4899" : "none",
                  }}
                >
                  {p.name.charAt(0)}
                </button>
              ))}
            </div>
          )}

          {/* 우측 버튼 — 데스크탑만 */}
          {!isMobile && (
            <div className="flex items-center gap-0.5 shrink-0">
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
