"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FLOATS = [
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
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          style={{ top: f.top, left: (f as any).left, right: (f as any).right, bottom: (f as any).bottom, fontSize: f.size, animationDelay: f.delay, animationDuration: "2.5s" }}
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
            style={{ background: "linear-gradient(90deg, #FF4FAD, #9B5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            아장아장
          </h1>
          <p className="text-sm font-semibold mt-1" style={{ color: "#FF85C1" }}>우리 아이 첫 번째 학습 친구 💕</p>
        </div>

        {/* 카드 */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-sm p-6" style={{ boxShadow: "0 8px 40px rgba(255,105,180,0.25), 0 0 0 2px rgba(255,105,180,0.15)" }}>
          <h2 className="text-lg font-black mb-5" style={{ color: "#FF4FAD" }}>로그인 ✨</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold text-pink-600">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-pink-200 focus:border-pink-400 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-bold text-pink-600">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-pink-200 focus:border-pink-400 rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-xl font-black text-base py-5"
              style={{ background: "linear-gradient(90deg, #FF6BB5, #C778E8)", border: "none" }}
              disabled={loading}
            >
              {loading ? "로그인 중... ✨" : "로그인하기 🌟"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm font-semibold mt-4" style={{ color: "#FF85C1" }}>
          계정이 없으신가요?{" "}
          <Link href="/register" className="font-black underline underline-offset-2" style={{ color: "#C778E8" }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
