"use client";

import { useEffect, useRef, useState } from "react";

// 전역 동시 로드 제한 (최대 3개)
let _active = 0;
const MAX = 3;
const _queue: (() => void)[] = [];

function acquire(): Promise<void> {
  return new Promise(resolve => {
    if (_active < MAX) { _active++; resolve(); }
    else _queue.push(resolve);
  });
}

function release() {
  _active--;
  const next = _queue.shift();
  if (next) { _active++; next(); }
}

interface Props { src: string }

export default function VideoThumbnail({ src }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captured, setCaptured] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false); // 슬롯 획득 여부

  // 뷰포트 진입 감지
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 뷰포트 진입 후 슬롯 대기
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    acquire().then(() => { if (!cancelled) setReady(true); else release(); });
    return () => { cancelled = true; };
  }, [visible]);

  // 슬롯 획득 후 프레임 캡처
  useEffect(() => {
    if (!ready) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const onMeta = () => {
      video.currentTime = video.duration > 6 ? 3 : Math.max(0, video.duration * 0.15);
    };
    const onSeeked = () => {
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx || video.videoWidth === 0) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        setCaptured(true);
      } catch { /* 캡처 실패 — 플레이스홀더 유지 */ }
      finally { release(); }
    };
    const onError = () => release();

    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
  }, [ready, src]);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {ready && (
        <video ref={videoRef} src={src} preload="metadata" muted playsInline className="hidden" />
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: captured ? "block" : "none" }}
      />
      {!captured && <div className="text-5xl">🎬</div>}
    </div>
  );
}
