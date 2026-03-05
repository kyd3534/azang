"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <p className="text-6xl mb-4">🙈</p>
      <h2 className="text-xl font-black text-gray-700 mb-2">앗! 뭔가 잘못됐어요</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs">
        {error.message || "잠시 후 다시 시도해 주세요."}
      </p>
      <Button
        onClick={reset}
        className="px-6 py-3 rounded-2xl font-black text-white border-none"
        style={{ background: "linear-gradient(135deg, #FF8A50, #FF5722)" }}
      >
        다시 시도하기 🔄
      </Button>
    </div>
  );
}
