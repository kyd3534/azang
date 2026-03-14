"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Usage {
  generation_count: number;
  generation_limit: number;
  generation_reset_at: string;
}

export default function GenerationUsage() {
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("profiles")
        .select("generation_count, generation_limit, generation_reset_at")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setUsage(data as Usage);
        });
    });
  }, []);

  if (!usage) return null;

  const { generation_count, generation_limit, generation_reset_at } = usage;
  const remaining = generation_limit - generation_count;
  const pct = Math.min((generation_count / generation_limit) * 100, 100);
  const resetDate = new Date(generation_reset_at).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });

  const isWarning = remaining <= 5 && remaining > 0;
  const isExhausted = remaining <= 0;

  if (generation_limit >= 999999) return null; // 관리자는 표시 안 함

  return (
    <div
      className="rounded-2xl px-4 py-3 mb-4 text-sm"
      style={{
        background: isExhausted
          ? "#FFF0F0"
          : isWarning
          ? "#FFF8F0"
          : "#FFF5FB",
        border: isExhausted
          ? "1.5px solid #FFCCCC"
          : isWarning
          ? "1.5px solid #FFDDAA"
          : "1.5px solid #FFD6EC",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="font-bold"
          style={{ color: isExhausted ? "#E53E3E" : isWarning ? "#DD6B20" : "#C2185B" }}
        >
          {isExhausted
            ? "⚠️ 이번 달 생성 한도에 도달했어요"
            : isWarning
            ? `⏰ 이번 달 ${remaining}회 남았어요`
            : `✨ 이번 달 ${generation_count} / ${generation_limit}회 사용`}
        </span>
        <span className="text-xs" style={{ color: "#999" }}>
          {resetDate} 초기화
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: isExhausted ? "#FFCCCC" : isWarning ? "#FFDDAA" : "#FFD6EC" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isExhausted
              ? "#FC8181"
              : isWarning
              ? "#F6AD55"
              : "linear-gradient(90deg, #FF6BB5, #C778E8)",
          }}
        />
      </div>
      {isExhausted && (
        <p className="mt-2 text-xs" style={{ color: "#E53E3E" }}>
          캐시된 콘텐츠(같은 주제+연령대)는 무제한 생성 가능해요 🎉
        </p>
      )}
    </div>
  );
}
