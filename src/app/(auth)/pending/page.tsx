"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #FFD6EC 0%, #EDD6FF 50%, #D6EEFF 100%)" }}
    >
      <div
        className="w-full max-w-sm text-center bg-white/90 rounded-3xl p-8 space-y-4"
        style={{ boxShadow: "0 8px 40px rgba(255,105,180,0.25)" }}
      >
        <div className="text-6xl animate-bounce">⏳</div>
        <h2 className="text-xl font-black" style={{ color: "#FF4FAD" }}>가입 승인 대기 중</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          가입 신청이 완료됐어요!<br />
          관리자가 승인하면 이용할 수 있어요.<br />
          <span className="font-semibold text-pink-400">잠시만 기다려주세요 🌸</span>
        </p>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-400 underline mt-2"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
