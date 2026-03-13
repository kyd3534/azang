"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import { X, Play, RefreshCw, Loader2 } from "lucide-react";
import VideoPlayer from "@/components/ui/VideoPlayer";

const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;

function toTitle(filename: string) {
  return filename.replace(VIDEO_EXT, "").replace(/[_\-]/g, " ");
}

export default function VideosPage() {
  const router = useRouter();
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email !== "kyd3534@gmail.com") {
      router.replace("/dashboard/games");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/nas-videos");
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setFiles([]);
      } else {
        setFiles(json.files ?? []);
      }
    } catch {
      setError("NAS 연결 실패");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const streamUrl = (filename: string) =>
    `/api/video-proxy?file=${encodeURIComponent(filename)}`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={36} className="animate-spin" style={{ color: "#FF69B4" }} />
        <p className="text-sm font-bold text-gray-400">NAS에서 영상 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="영상 보기" emoji="📺" backHref="/dashboard/games" />
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: "#F3E8FF", color: "#7E22CE" }}
        >
          <RefreshCw size={12} />
          새로고침
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl p-4 text-sm font-semibold"
          style={{ background: "#FEF2F2", border: "2px solid #FECACA", color: "#DC2626" }}>
          ❌ {error}
          <p className="text-xs mt-1 font-normal text-red-400">
            관리자 패널에서 NAS 연결 설정을 저장해주세요.
          </p>
        </div>
      )}

      {!error && files.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-gray-400 font-semibold">영상이 없어요</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((filename) => (
            <button
              key={filename}
              onClick={() => setSelected(filename)}
              className="text-left rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 active:scale-95"
              style={{
                background: "white",
                border: "2px solid #FFD6EC",
                boxShadow: "0 4px 16px rgba(255,100,180,0.12)",
              }}
            >
              <div
                className="relative aspect-video flex items-center justify-center group"
                style={{ background: "linear-gradient(135deg, #FFE8F5 0%, #E8D6FF 100%)" }}
              >
                <div className="text-5xl">🎬</div>
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.25)" }}
                >
                  <div className="rounded-full p-3" style={{ background: "rgba(255,105,180,0.9)" }}>
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <p className="font-black text-sm truncate" style={{ color: "#C2185B" }}>
                  {toTitle(filename)}
                </p>
                <p className="text-xs mt-0.5 truncate opacity-40" style={{ color: "#C2185B" }}>
                  {filename}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 플레이어 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div
            className="w-full max-w-4xl rounded-3xl overflow-hidden"
            style={{ background: "#1a1a2e", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}
          >
            {/* 헤더 */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "linear-gradient(90deg, #FF85C1, #C778E8)" }}
            >
              <span className="font-black text-white truncate">{toTitle(selected)}</span>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 ml-3 shrink-0 transition-opacity hover:opacity-75"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            {/* 플레이어 */}
            <VideoPlayer
              key={selected}
              src={streamUrl(selected)}
              title={toTitle(selected)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
