"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import { X, Play, RefreshCw, Loader2, ChevronRight, Home } from "lucide-react";
import VideoPlayer from "@/components/ui/VideoPlayer";
import VideoThumbnail from "@/components/ui/VideoThumbnail";

const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;

function toTitle(filename: string) {
  return filename.replace(VIDEO_EXT, "").replace(/[_\-]/g, " ");
}

// 폴더 이름에서 커버 이니셜 색상 결정
const FOLDER_GRADIENTS = [
  "linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 100%)",
  "linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)",
  "linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 100%)",
  "linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)",
  "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)",
  "linear-gradient(135deg, #FCE7F3 0%, #F9A8D4 100%)",
];

function folderGradient(name: string) {
  const idx = name.charCodeAt(0) % FOLDER_GRADIENTS.length;
  return FOLDER_GRADIENTS[idx];
}

export default function VideosPage() {
  const router = useRouter();
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentSubpath = pathSegments.join("/");

  const load = useCallback(async (subpath: string, forceRefresh = false) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email !== "kyd3534@gmail.com") {
      router.replace("/dashboard/games");
      return;
    }

    // sessionStorage 캐시 확인 (새로고침 버튼 시 skip)
    if (!forceRefresh) {
      try {
        const raw = sessionStorage.getItem(`nas-listing:${subpath}`);
        if (raw) {
          const { files, folders, ts } = JSON.parse(raw);
          if (Date.now() - ts < 30_000) {
            setFolders(folders);
            setFiles(files);
            setLoading(false);
            return;
          }
        }
      } catch { /* sessionStorage 사용 불가 시 무시 */ }
    }

    setLoading(true);
    setError("");

    try {
      const url = subpath
        ? `/api/nas-videos?subpath=${encodeURIComponent(subpath)}`
        : "/api/nas-videos";
      const res = await fetch(url);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setFolders([]);
        setFiles([]);
      } else {
        setFolders(json.folders ?? []);
        setFiles(json.files ?? []);
        // 캐시 저장
        try {
          sessionStorage.setItem(
            `nas-listing:${subpath}`,
            JSON.stringify({ files: json.files ?? [], folders: json.folders ?? [], ts: Date.now() })
          );
        } catch { /* ignore */ }
      }
    } catch {
      setError("NAS 연결 실패");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(currentSubpath); }, [load, currentSubpath]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fullPath = (filename: string) =>
    currentSubpath ? `${currentSubpath}/${filename}` : filename;

  const streamUrl = (relPath: string) =>
    `/api/video-proxy?file=${encodeURIComponent(relPath)}`;

  const enterFolder = (name: string) => setPathSegments(prev => [...prev, name]);
  const navigateTo = (idx: number) => setPathSegments(prev => prev.slice(0, idx));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={36} className="animate-spin" style={{ color: "#FF69B4" }} />
        <p className="text-sm font-bold text-gray-400">NAS에서 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <PageHeader title="영상 보기" emoji="📺" backHref="/dashboard/games" />
        <button
          onClick={() => load(currentSubpath, true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: "#F3E8FF", color: "#7E22CE" }}
        >
          <RefreshCw size={12} />
          새로고침
        </button>
      </div>

      {/* 브레드크럼 */}
      {pathSegments.length > 0 && (
        <div className="flex items-center gap-1 mb-5 flex-wrap">
          <button
            onClick={() => navigateTo(0)}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors hover:opacity-80"
            style={{ background: "#FFE8F5", color: "#C2185B" }}
          >
            <Home size={11} />
            홈
          </button>
          {pathSegments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-gray-300" />
              <button
                onClick={() => navigateTo(i + 1)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors hover:opacity-80"
                style={
                  i === pathSegments.length - 1
                    ? { background: "#FF69B4", color: "white" }
                    : { background: "#FFE8F5", color: "#C2185B" }
                }
              >
                {seg}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div
          className="mb-6 rounded-2xl p-4 text-sm font-semibold"
          style={{ background: "#FEF2F2", border: "2px solid #FECACA", color: "#DC2626" }}
        >
          {error}
          <p className="text-xs mt-1 font-normal text-red-400">
            관리자 패널에서 NAS 연결 설정을 저장해주세요.
          </p>
        </div>
      )}

      {/* 비어있음 */}
      {!error && folders.length === 0 && files.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-gray-400 font-semibold">영상이 없어요</p>
        </div>
      )}

      {/* 그리드 */}
      {(folders.length > 0 || files.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* 폴더 카드 */}
          {folders.map((folderName) => (
            <button
              key={`folder-${folderName}`}
              onClick={() => enterFolder(folderName)}
              className="text-left rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 active:scale-95"
              style={{
                background: "white",
                border: "2px solid #C4B5FD",
                boxShadow: "0 4px 16px rgba(139,92,246,0.15)",
              }}
            >
              <div
                className="relative aspect-video flex items-center justify-center"
                style={{ background: folderGradient(folderName) }}
              >
                {/* 폴더 아이콘 */}
                <div className="flex flex-col items-center gap-1">
                  <div className="text-5xl">📁</div>
                </div>
                {/* 오른쪽 하단 화살표 */}
                <div
                  className="absolute bottom-2 right-2 rounded-full p-1"
                  style={{ background: "rgba(109,40,217,0.15)" }}
                >
                  <ChevronRight size={14} style={{ color: "#6D28D9" }} />
                </div>
              </div>
              <div className="p-3">
                <p className="font-black text-sm truncate" style={{ color: "#6D28D9" }}>
                  {folderName}
                </p>
                <p className="text-xs mt-0.5 font-semibold" style={{ color: "#A78BFA" }}>
                  폴더
                </p>
              </div>
            </button>
          ))}

          {/* 영상 카드 */}
          {files.map((filename) => {
            const relPath = fullPath(filename);
            return (
              <button
                key={relPath}
                onClick={() => setSelected(relPath)}
                className="text-left rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-1 active:scale-95"
                style={{
                  background: "white",
                  border: "2px solid #FFD6EC",
                  boxShadow: "0 4px 16px rgba(255,100,180,0.12)",
                }}
              >
                <div
                  className="relative aspect-video group overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #FFE8F5 0%, #E8D6FF 100%)" }}
                >
                  <VideoThumbnail src={streamUrl(relPath)} />
                  {/* 호버 오버레이 */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.3)" }}
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
                </div>
              </button>
            );
          })}
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
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: "linear-gradient(90deg, #FF85C1, #C778E8)" }}
            >
              <span className="font-black text-white truncate">
                {toTitle(selected.split("/").pop() ?? selected)}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 ml-3 shrink-0 transition-opacity hover:opacity-75"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                <X size={18} className="text-white" />
              </button>
            </div>
            <VideoPlayer
              key={selected}
              src={streamUrl(selected)}
              title={toTitle(selected.split("/").pop() ?? selected)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
