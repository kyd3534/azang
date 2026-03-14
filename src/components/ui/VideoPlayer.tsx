"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, Loader2, RotateCcw, RotateCw,
} from "lucide-react";

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface Props {
  src: string;
  title?: string;
}

export default function VideoPlayer({ src, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100); // 0~100
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // 드래그 중 화면 표시용 — 실제 seek는 release 시에만
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, [clearHide]);

  const onActivity = useCallback(() => {
    setShowControls(true);
    if (videoRef.current && !videoRef.current.paused) scheduleHide();
  }, [scheduleHide]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); scheduleHide(); }
    else { v.pause(); clearHide(); setShowControls(true); }
  }, [scheduleHide, clearHide]);

  const skip = useCallback((secs: number) => {
    const v = videoRef.current;
    if (!v || !isFinite(duration)) return;
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + secs));
  }, [duration]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted || v.volume === 0) {
      v.muted = false;
      const restore = volume > 0 ? volume : 50;
      v.volume = restore / 100;
      setVolume(restore);
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
  }, [volume]);

  const onVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    const v = videoRef.current;
    if (!v) return;
    v.volume = val / 100;
    v.muted = val === 0;
    setMuted(val === 0);
  }, []);


  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // --- Seek 핸들러 ---
  // 드래그 시작: seeking 모드 진입 (비디오는 건드리지 않음)
  const onSeekStart = useCallback(() => {
    setSeeking(true);
    setSeekValue(videoRef.current?.currentTime ?? 0);
  }, []);

  // 드래그 중: 화면 표시만 업데이트 (range 요청 없음)
  const onSeekInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(Number(e.target.value));
  }, []);

  // 드래그 해제: 이때만 실제 seek
  const onSeekRelease = useCallback(() => {
    if (videoRef.current) videoRef.current.currentTime = seekValue;
    setSeeking(false);
  }, [seekValue]);

  // 호버 툴팁 상태
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);

  const onSeekBarMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPct(pct);
  }, [duration]);

  const onSeekBarMouseLeave = useCallback(() => setHoverPct(null), []);

  // 호버 위치 클릭 시 해당 시간으로 즉시 이동
  const onSeekBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = seekBarRef.current;
    if (!bar || !duration || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  }, [duration]);

  const displayTime = seeking ? seekValue : currentTime;
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0;
  const buffPct = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black overflow-hidden select-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={onActivity}
      onTouchStart={onActivity}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full cursor-pointer"
        playsInline
        preload="metadata"
        title={title}
        onPlay={() => { setPlaying(true); scheduleHide(); }}
        onPause={() => { setPlaying(false); clearHide(); setShowControls(true); }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v || seeking) return;
          setCurrentTime(v.currentTime);
          // 현재 위치 기준 버퍼 끝 계산
          for (let i = 0; i < v.buffered.length; i++) {
            if (v.buffered.start(i) <= v.currentTime && v.currentTime <= v.buffered.end(i)) {
              setBufferedEnd(v.buffered.end(i));
              break;
            }
          }
        }}
        onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onSeeking={() => setWaiting(true)}
        onSeeked={() => setWaiting(false)}
        onClick={togglePlay}
      />

      {/* 버퍼링 스피너 */}
      {waiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
            <Loader2 size={36} className="animate-spin text-white" />
          </div>
        </div>
      )}

      {/* 컨트롤 오버레이 */}
      <div
        className="absolute inset-0 flex flex-col justify-end transition-opacity duration-300"
        style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
      >
        {/* 하단 그라디언트 */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }}
        />

        <div className="relative z-10 px-4 pb-4 space-y-2">
          {/* Seek 바 */}
          <div
            ref={seekBarRef}
            className="relative flex items-center h-5 group/seek"
            onMouseMove={onSeekBarMouseMove}
            onMouseLeave={onSeekBarMouseLeave}
            onClick={onSeekBarClick}
          >
            {/* 호버 시간 툴팁 */}
            {hoverPct !== null && duration > 0 && (
              <div
                className="absolute -top-9 -translate-x-1/2 px-2 py-1 rounded-lg text-white text-xs font-mono font-bold pointer-events-none whitespace-nowrap z-20"
                style={{
                  left: `${hoverPct * 100}%`,
                  background: "rgba(0,0,0,0.85)",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {fmt(hoverPct * duration)}
              </div>
            )}
            {/* 트랙 배경 */}
            <div className="absolute w-full h-1 rounded-full transition-all group-hover/seek:h-1.5" style={{ background: "rgba(255,255,255,0.2)" }} />
            {/* 버퍼 */}
            <div
              className="absolute h-1 rounded-full transition-all group-hover/seek:h-1.5"
              style={{ width: `${buffPct}%`, background: "rgba(255,255,255,0.35)" }}
            />
            {/* 재생 위치 */}
            <div
              className="absolute h-1 rounded-full transition-all group-hover/seek:h-1.5"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #FF85C1, #FF69B4)" }}
            />
            {/* 호버 위치 미리보기 선 */}
            {hoverPct !== null && (
              <div
                className="absolute w-0.5 h-3 rounded-full -translate-x-1/2 pointer-events-none opacity-60"
                style={{ left: `${hoverPct * 100}%`, background: "white" }}
              />
            )}
            {/* 썸 */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full -translate-x-1/2 shadow-lg transition-opacity duration-150"
              style={{
                left: `${progress}%`,
                background: "#FF69B4",
                boxShadow: "0 0 6px rgba(255,105,180,0.8)",
                opacity: seeking || hoverPct !== null ? 1 : 0,
              }}
            />
            {/* 투명 range input — 드래그 영역 */}
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={1}
              value={displayTime}
              className="absolute w-full cursor-pointer opacity-0"
              style={{ height: "20px" }}
              onMouseDown={onSeekStart}
              onTouchStart={onSeekStart}
              onChange={onSeekInput}
              onMouseUp={onSeekRelease}
              onTouchEnd={onSeekRelease}
            />
          </div>

          {/* 버튼 행 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); skip(-10); }}
                className="text-white hover:text-pink-300 transition-colors"
                title="10초 뒤로"
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="flex items-center justify-center rounded-full w-9 h-9 shrink-0"
                style={{ background: "#FF69B4" }}
              >
                {playing
                  ? <Pause size={16} fill="white" className="text-white" />
                  : <Play size={16} fill="white" className="text-white ml-0.5" />
                }
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); skip(10); }}
                className="text-white hover:text-pink-300 transition-colors"
                title="10초 앞으로"
              >
                <RotateCw size={18} />
              </button>

              <span className="text-white text-xs font-mono select-none">
                {fmt(displayTime)}
                <span className="opacity-40 mx-1">/</span>
                {fmt(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* 음량 아이콘 — 클릭으로 음소거 토글 */}
              <button
                onClick={toggleMute}
                className="text-white hover:text-pink-300 transition-colors shrink-0"
                title={muted ? "소리 켜기" : "음소거"}
              >
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* 음량 슬라이더 — 항상 표시 */}
              <div className="relative flex items-center" style={{ width: 72, height: 20 }}>
                {/* 트랙 */}
                <div
                  className="absolute rounded-full"
                  style={{ left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.3)" }}
                />
                {/* 채워진 바 */}
                <div
                  className="absolute rounded-full"
                  style={{
                    left: 0,
                    width: `${muted ? 0 : volume}%`,
                    height: 4,
                    background: "#FF69B4",
                  }}
                />
                {/* 썸 */}
                <div
                  className="absolute rounded-full"
                  style={{
                    left: `${muted ? 0 : volume}%`,
                    transform: "translateX(-50%)",
                    width: 12,
                    height: 12,
                    background: "white",
                    boxShadow: "0 0 4px rgba(255,105,180,0.9)",
                    pointerEvents: "none",
                  }}
                />
                {/* 실제 input */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={muted ? 0 : volume}
                  onChange={onVolumeChange}
                  className="absolute inset-0 w-full cursor-pointer"
                  style={{ opacity: 0, height: "100%" }}
                />
              </div>

              {/* 숫자 */}
              <span className="text-white text-xs font-mono font-bold" style={{ minWidth: 24 }}>
                {muted ? 0 : volume}
              </span>

              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="text-white hover:text-pink-300 transition-colors ml-1"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
