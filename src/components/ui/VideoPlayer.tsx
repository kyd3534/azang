"use client";

import { useEffect, useRef } from "react";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  src: string;
  title?: string;
}

export default function VideoPlayer({ src, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    let cancelled = false;

    import("plyr").then(({ default: Plyr }) => {
      if (cancelled || !videoRef.current) return;

      playerRef.current = new Plyr(videoRef.current, {
        controls: [
          "play-large",
          "play",
          "rewind",
          "fast-forward",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "fullscreen",
        ],
        resetOnEnd: false,
        keyboard: { focused: true, global: false },
        tooltips: { controls: true, seek: true },
        i18n: {
          play: "재생",
          pause: "일시정지",
          rewind: "5초 뒤로",
          fastForward: "5초 앞으로",
          mute: "음소거",
          unmute: "소리 켜기",
          enterFullscreen: "전체화면",
          exitFullscreen: "전체화면 종료",
          volume: "볼륨",
          currentTime: "현재 시간",
          duration: "전체 길이",
        },
      });

      playerRef.current.source = {
        type: "video",
        sources: [{ src, type: "video/mp4" }],
      };
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [src]);

  return (
    <div
      style={
        {
          "--plyr-color-main": "#FF69B4",
          "--plyr-range-fill-background": "#FF69B4",
        } as React.CSSProperties
      }
    >
      <video ref={videoRef} playsInline title={title} />
    </div>
  );
}
