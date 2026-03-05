"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

const FLOATS: { emoji: string; top?: string; left?: string; right?: string; bottom?: string; delay: string; size: string }[] = [
  { emoji: "🌸", top: "8%", left: "6%", delay: "0s", size: "2.5rem" },
  { emoji: "⭐", top: "12%", right: "8%", delay: "0.4s", size: "2rem" },
  { emoji: "💖", top: "70%", left: "4%", delay: "0.8s", size: "2rem" },
  { emoji: "🦋", top: "75%", right: "6%", delay: "0.2s", size: "2.2rem" },
  { emoji: "✨", top: "40%", left: "3%", delay: "1.1s", size: "1.8rem" },
  { emoji: "🌟", top: "35%", right: "4%", delay: "0.6s", size: "1.8rem" },
  { emoji: "🌷", bottom: "8%", left: "12%", delay: "0.9s", size: "2rem" },
  { emoji: "🎀", bottom: "12%", right: "10%", delay: "0.3s", size: "2rem" },
];

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSocialLogin(provider: "google") {
    setError("");
    setLoading(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("로그인 중 오류가 발생했어요. 다시 시도해주세요.");
      setLoading(null);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #FFD6EC 0%, #EDD6FF 50%, #D6EEFF 100%)" }}
    >
      {/* 플로팅 장식 */}
      {FLOATS.map((f, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none animate-bounce opacity-60"
          style={{
            top: f.top,
            left: f.left,
            right: f.right,
            bottom: f.bottom,
            fontSize: f.size,
            animationDelay: f.delay,
            animationDuration: "2.5s",
          }}
        >
          {f.emoji}
        </div>
      ))}

      <div className="w-full max-w-sm relative z-10">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 animate-bounce">🦄</div>
          <h1
            className="text-3xl font-black"
            style={{
              background: "linear-gradient(90deg, #FF4FAD, #9B5CFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            아장아장
          </h1>
          <p className="text-sm font-semibold mt-1" style={{ color: "#FF85C1" }}>
            우리 아이 첫 번째 학습 친구 💕
          </p>
        </div>

        {/* 카드 */}
        <div
          className="rounded-3xl bg-white/90 backdrop-blur-sm p-6 space-y-3"
          style={{ boxShadow: "0 8px 40px rgba(255,105,180,0.25), 0 0 0 2px rgba(255,105,180,0.15)" }}
        >
          <h2 className="text-lg font-black mb-2 text-center" style={{ color: "#FF4FAD" }}>
            소셜 계정으로 시작하기 ✨
          </h2>

          {/* Google */}
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: "white", border: "2px solid #E5E7EB", color: "#374151" }}
          >
            {loading === "google" ? (
              <span className="animate-spin text-base">⏳</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            Google로 계속하기
          </button>

          {error && (
            <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2 text-center">{error}</p>
          )}

          <p className="text-xs text-center pt-2" style={{ color: "#BBBBBB" }}>
            로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
