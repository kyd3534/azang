"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Save, ArrowLeft, Folder, ChevronRight, Check, RefreshCw, Wifi, Info } from "lucide-react";
import Link from "next/link";

const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;

export default function AdminVideosPage() {
  const router = useRouter();

  // 연결 정보
  const [host, setHost] = useState("kyd3534.synology.me");
  const [port, setPort] = useState("7777");
  const [useHttps, setUseHttps] = useState(true);
  const [username, setUsername] = useState("kyd3534");
  const [password, setPassword] = useState("");
  const [folderPath, setFolderPath] = useState("/video/kids");

  // 폴더 브라우저
  const [currentPath, setCurrentPath] = useState("/");
  const [browseFiles, setBrowseFiles] = useState<string[]>([]);
  const [browseFolders, setBrowseFolders] = useState<string[]>([]);
  const [browseError, setBrowseError] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const [connected, setConnected] = useState(false);

  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email !== "kyd3534@gmail.com") { router.replace("/dashboard"); return; }

    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["nas_host", "nas_port", "nas_https", "nas_username", "nas_folder_path"]);

    data?.forEach(({ key, value }) => {
      if (key === "nas_host") setHost(value);
      if (key === "nas_port") setPort(value || "7777");
      if (key === "nas_https") setUseHttps(value !== "false");
      if (key === "nas_username") setUsername(value);
      if (key === "nas_folder_path") { setFolderPath(value); setCurrentPath(value); }
    });
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // 서버사이드 API로 폴더 탐색 (WebDAV, CORS 없음)
  async function browseDir(path: string) {
    setBrowsing(true);
    setBrowseError("");

    const res = await fetch("/api/nas-browse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: host.trim(),
        port: port.trim(),
        useHttps,
        username: username.trim(),
        password,
        path,
      }),
    });

    const json = await res.json();

    if (json.error) {
      const cause: string = json.cause ?? "";
      let diagnosis = "";
      if (cause.includes("ConnectTimeout") || cause.includes("Timeout") || cause.includes("ETIMEDOUT")) {
        diagnosis = "⏱ 연결 시간 초과 — 포트 7777이 라우터에서 포워딩되어 있는지 확인해주세요";
      } else if (cause.includes("ECONNREFUSED")) {
        diagnosis = "🚫 연결 거부 — WebDAV Server가 실행 중인지, 포트가 7777인지 확인해주세요";
      } else if (cause.includes("ENOTFOUND")) {
        diagnosis = "🔍 주소를 찾을 수 없어요 — 호스트명을 확인해주세요 (예: kyd3534.synology.me)";
      } else if (json.error.includes("인증 실패") || json.error.includes("비밀번호") || json.error.includes("401")) {
        diagnosis = "🔑 아이디/비밀번호를 확인해주세요";
      } else if (json.error.includes("403") || json.error.includes("권한")) {
        diagnosis = "🔒 WebDAV 접근 권한 필요 — DSM → WebDAV Server → 공유폴더 권한 확인";
      }
      setBrowseError(`시도한 URL: ${json.baseUrl ?? ""}\n오류: ${json.error}\n${cause ? `원인: ${cause}` : ""}${diagnosis ? `\n\n💡 ${diagnosis}` : ""}`);
      setConnected(false);
    } else {
      setCurrentPath(path);
      setBrowseFolders(json.folders ?? []);
      setBrowseFiles(json.files ?? []);
      setConnected(true);
    }
    setBrowsing(false);
  }

  // 파일 목록 Supabase에 캐시 저장
  async function syncFileList() {
    setSyncing(true);

    const res = await fetch("/api/nas-browse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: host.trim(),
        port: port.trim(),
        useHttps,
        username: username.trim(),
        password,
        path: folderPath,
      }),
    });

    const json = await res.json();
    if (json.error) {
      setSaveMsg("❌ " + json.error);
      setSyncing(false);
      return;
    }

    const files: string[] = (json.files ?? []).filter((f: string) => VIDEO_EXT.test(f));
    const supabase = createClient();
    await supabase.from("app_settings").upsert({
      key: "nas_video_cache",
      value: JSON.stringify(files),
      updated_at: new Date().toISOString(),
    });

    setSaveMsg(`✅ ${files.length}개 영상 목록 저장 완료!`);
    setSyncing(false);
    setTimeout(() => setSaveMsg(""), 4000);
  }

  async function saveSettings() {
    if (!host || !password) return;
    setSaving(true);
    const supabase = createClient();
    for (const e of [
      { key: "nas_host", value: host.trim() },
      { key: "nas_port", value: port.trim() },
      { key: "nas_https", value: String(useHttps) },
      { key: "nas_username", value: username.trim() },
      { key: "nas_password", value: password },
      { key: "nas_folder_path", value: folderPath },
    ]) {
      await supabase.from("app_settings").upsert({ ...e, updated_at: new Date().toISOString() });
    }
    setSaveMsg("✅ 저장 완료!");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  const dsmUrl = `${useHttps ? "https" : "http"}://${host.trim()}:${port.trim() || "7777"}`;
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin" className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <h1 className="text-2xl font-black" style={{ color: "#0369A1" }}>📺 NAS 영상 설정</h1>
      </div>

      {/* 연결 정보 */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "white", border: "2px solid #BFDBFE", boxShadow: "0 4px 24px rgba(14,165,233,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-black text-base" style={{ color: "#0369A1" }}>🔗 WebDAV 연결 정보</h2>
          {connected && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#D1FAE5", color: "#059669" }}>
              ✅ 연결됨
            </span>
          )}
        </div>

        {/* 호스트 + 포트 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-xs font-bold text-gray-400 mb-1 block">호스트</label>
            <input
              value={host}
              onChange={(e) => { setHost(e.target.value); setConnected(false); }}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "2px solid #BFDBFE", background: "#F0F9FF", color: "#0C4A6E" }}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">포트</label>
            <input
              value={port}
              onChange={(e) => { setPort(e.target.value); setConnected(false); }}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "2px solid #BFDBFE", background: "#F0F9FF", color: "#0C4A6E" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">사용자</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "2px solid #BFDBFE", background: "#F0F9FF", color: "#0C4A6E" }}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">암호 <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setConnected(false); }}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: "2px solid #BFDBFE", background: "#F0F9FF", color: "#0C4A6E" }}
            />
          </div>
        </div>

        {/* 안내 */}
        <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}>
          <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#3B82F6" }} />
          <p className="text-xs" style={{ color: "#1E40AF" }}>
            시놀로지 WebDAV Server(포트 7777)를 사용합니다.<br />
            DSM → 패키지센터 → WebDAV Server 설치 후, HTTPS 포트 7777이 라우터에서 포워딩되어 있어야 해요.
          </p>
        </div>

        {/* HTTPS 토글 + URL 미리보기 */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-gray-500">HTTPS</span>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{dsmUrl}</p>
          </div>
          <button
            onClick={() => { setUseHttps(!useHttps); setConnected(false); }}
            className="relative w-12 h-6 rounded-full transition-colors shrink-0"
            style={{ background: useHttps ? "#F59E0B" : "#D1D5DB" }}
          >
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
              style={{ left: useHttps ? "26px" : "2px" }} />
          </button>
        </div>

        {/* 영상 폴더 경로 */}
        <div>
          <label className="text-xs font-bold text-gray-400 mb-1 block">영상 폴더 경로</label>
          <input
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="/video/kids"
            className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
            style={{ border: "2px solid #BFDBFE", background: "#F0F9FF", color: "#0C4A6E" }}
          />
        </div>

        {/* 연결 버튼 */}
        <button
          onClick={() => browseDir(folderPath || "/")}
          disabled={browsing || !password}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
          style={{
            background: browsing || !password ? "#F3F4F6" : "#F0FDF4",
            color: browsing || !password ? "#9CA3AF" : "#166534",
            border: `2px solid ${browsing || !password ? "#E5E7EB" : "#BBF7D0"}`,
          }}
        >
          {browsing ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
          {browsing ? "연결 중..." : "연결 테스트 & 폴더 탐색"}
        </button>

        {browseError && (
          <div className="rounded-xl p-3 space-y-1" style={{ background: "#FEF2F2", border: "1.5px solid #FECACA" }}>
            <p className="text-sm font-bold" style={{ color: "#DC2626" }}>❌ 연결 실패</p>
            {browseError.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="text-xs mt-0.5" style={{ color: line.startsWith("💡") ? "#92400E" : "#EF4444" }}>
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 폴더 브라우저 */}
      {connected && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: "white", border: "2px solid #E9D5FF", boxShadow: "0 4px 24px rgba(147,51,234,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base" style={{ color: "#7E22CE" }}>📁 폴더 탐색</h2>
            <button onClick={() => browseDir(currentPath)} disabled={browsing}
              className="p-1.5 rounded-lg hover:bg-purple-50" style={{ color: "#A78BFA" }}>
              <RefreshCw size={14} className={browsing ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <button onClick={() => browseDir("/")} className="font-bold px-2 py-1 rounded-lg hover:bg-purple-50" style={{ color: "#7E22CE" }}>/</button>
            {pathParts.map((part, i) => {
              const p = "/" + pathParts.slice(0, i + 1).join("/");
              return (
                <span key={p} className="flex items-center gap-1">
                  <ChevronRight size={12} className="text-gray-300" />
                  <button onClick={() => browseDir(p)} className="font-bold px-2 py-1 rounded-lg hover:bg-purple-50" style={{ color: "#7E22CE" }}>{part}</button>
                </span>
              );
            })}
          </div>

          {/* 이 폴더 선택 */}
          <button
            onClick={() => setFolderPath(currentPath)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: folderPath === currentPath ? "#F0FDF4" : "linear-gradient(90deg,#A78BFA,#7C3AED)",
              color: folderPath === currentPath ? "#166534" : "white",
              border: folderPath === currentPath ? "2px solid #BBF7D0" : "none",
            }}
          >
            {folderPath === currentPath ? <><Check size={14} /> 선택됨: {currentPath}</> : <>이 폴더로 설정: {currentPath}</>}
          </button>

          {/* 하위 폴더 */}
          {browseFolders.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400">하위 폴더</p>
              {browseFolders.map((f) => {
                const p = currentPath === "/" ? `/${f}` : `${currentPath}/${f}`;
                return (
                  <button key={f} onClick={() => browseDir(p)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-purple-50 text-left"
                    style={{ color: "#4C1D95" }}>
                    <Folder size={15} style={{ color: "#A78BFA" }} />
                    {f}
                    <ChevronRight size={13} className="ml-auto text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}

          {/* 영상 파일 */}
          {browseFiles.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-400">영상 파일 {browseFiles.length}개 발견 ✅</p>
              {browseFiles.slice(0, 5).map(f => (
                <p key={f} className="text-xs text-gray-500 pl-2">• {f}</p>
              ))}
              {browseFiles.length > 5 && <p className="text-xs text-gray-400 pl-2">... 외 {browseFiles.length - 5}개</p>}
            </div>
          )}

          {browseFolders.length === 0 && browseFiles.length === 0 && !browsing && (
            <p className="text-xs text-gray-400 text-center py-2">폴더가 비어있어요</p>
          )}

          {/* 목록 동기화 */}
          {folderPath && (
            <button
              onClick={syncFileList}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              style={{
                background: syncing ? "#F3F4F6" : "linear-gradient(90deg,#34D399,#059669)",
                color: syncing ? "#9CA3AF" : "white",
              }}
            >
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : "☁️"}
              {syncing ? "동기화 중..." : `영상 목록 저장`}
            </button>
          )}
        </div>
      )}

      {/* 설정 저장 */}
      <button
        onClick={saveSettings}
        disabled={saving || !host || !password}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-black"
        style={{
          background: saving || !host || !password ? "#E5E7EB" : "linear-gradient(90deg,#38BDF8,#0EA5E9)",
          color: saving || !host || !password ? "#9CA3AF" : "white",
          boxShadow: saving || !host || !password ? "none" : "0 4px 16px rgba(14,165,233,0.3)",
        }}
      >
        <Save size={16} />
        {saving ? "저장 중..." : "설정 저장"}
      </button>

      {saveMsg && (
        <p className="text-sm font-bold text-center" style={{ color: saveMsg.startsWith("✅") ? "#059669" : "#DC2626" }}>
          {saveMsg}
        </p>
      )}

      <p className="text-xs text-center text-gray-300 pb-4">관리자 전용 · kyd3534@gmail.com</p>
    </div>
  );
}
