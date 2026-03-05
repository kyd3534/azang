"use client";

import { useState } from "react";
import { Volume2, Square } from "lucide-react";
import { useVoice } from "@/lib/voice-context";

interface Props {
  text: string;
  lang?: "ko" | "en";
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
}

export default function SpeakButton({
  text,
  lang = "ko",
  className = "",
  style,
  iconSize = 16,
}: Props) {
  const { tts, stop } = useVoice();
  const [playing, setPlaying] = useState(false);

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (playing) {
      stop();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    tts(text, { lang, onEnd: () => setPlaying(false) });
  }

  function handleStop(e: React.MouseEvent) {
    e.stopPropagation();
    stop();
    setPlaying(false);
  }

  return (
    <div className="inline-flex items-center gap-0.5" style={{ lineHeight: 0 }}>
      {/* 재생 버튼 */}
      <button
        type="button"
        onClick={handlePlay}
        className={className}
        style={style}
        aria-label="읽어주기"
      >
        <Volume2
          size={iconSize}
          style={playing ? { color: "#EC4899" } : undefined}
          className={playing ? "animate-pulse" : ""}
        />
      </button>
      {/* 정지 버튼 — 항상 표시, 재생 중 아닐 때 흐리게 */}
      <button
        type="button"
        onClick={handleStop}
        className={className}
        style={{
          ...style,
          opacity: playing ? 1 : 0.25,
          cursor: playing ? "pointer" : "default",
        }}
        aria-label="정지"
      >
        <Square size={iconSize - 2} fill="currentColor" />
      </button>
    </div>
  );
}
