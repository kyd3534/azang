"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useVoice } from "@/lib/voice-context";
import type { StorySection } from "@/ai/flows/story";

interface PlayItem {
  text: string;
  sectionType: string;
}

const SECTION_META: Record<string, { label: string; bg: string; color: string }> = {
  기: { label: "이야기의 시작", bg: "#DBEAFE", color: "#1D4ED8" },
  승: { label: "이야기 전개",   bg: "#D1FAE5", color: "#065F46" },
  전: { label: "위기와 반전",   bg: "#FEF3C7", color: "#92400E" },
  결: { label: "행복한 결말",   bg: "#FCE7F3", color: "#BE185D" },
};

function buildPlaylist(
  sections: StorySection[],
  legacyPages: { text: string }[],
  moral: string,
): PlayItem[] {
  const items: PlayItem[] = [];
  if (sections.length > 0) {
    for (const s of sections) {
      for (const para of s.paragraphs) {
        items.push({ text: para, sectionType: s.type });
      }
    }
  } else {
    for (const p of legacyPages) {
      items.push({ text: p.text, sectionType: "기" });
    }
  }
  if (moral) {
    items.push({ text: `이 이야기의 교훈: ${moral}`, sectionType: "moral" });
  }
  return items;
}

interface StoryViewerProps {
  title: string;
  sections: StorySection[];
  legacyPages: { pageNumber: number; text: string; imagePrompt: string }[];
  moral: string;
}

export default function StoryViewer({ title, sections, legacyPages, moral }: StoryViewerProps) {
  const { tts, stop } = useVoice();

  const [playing, setPlaying]       = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const playingRef = useRef(false);
  const paraRefs   = useRef<(HTMLDivElement | null)[]>([]);

  const playlist = buildPlaylist(sections, legacyPages, moral);

  // 현재 문단으로 부드럽게 스크롤
  useEffect(() => {
    if (currentIdx >= 0) {
      paraRefs.current[currentIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentIdx]);

  function startPlayback(fromIdx: number) {
    const next = (idx: number) => {
      if (!playingRef.current) return;
      if (idx >= playlist.length) {
        playingRef.current = false;
        setPlaying(false);
        setCurrentIdx(-1);
        return;
      }
      setCurrentIdx(idx);
      tts(playlist[idx].text, { lang: "ko", onEnd: () => next(idx + 1) });
    };
    next(fromIdx);
  }

  function handlePlayPause() {
    if (playing) {
      playingRef.current = false;
      stop();
      setPlaying(false);
    } else {
      playingRef.current = true;
      setPlaying(true);
      startPlayback(currentIdx >= 0 ? currentIdx : 0);
    }
  }

  function handleRestart() {
    playingRef.current = false;
    stop();
    setPlaying(false);
    setCurrentIdx(-1);
  }

  function jumpTo(idx: number) {
    const wasPlaying = playingRef.current;
    playingRef.current = false;
    stop();
    setCurrentIdx(idx);
    if (wasPlaying) {
      setTimeout(() => {
        playingRef.current = true;
        setPlaying(true);
        startPlayback(idx);
      }, 120);
    }
  }

  // 섹션별 시작 인덱스 계산
  let pidx = 0;
  const sectionBlocks = sections.map((s) => {
    const start = pidx;
    pidx += s.paragraphs.length;
    return { ...s, startIdx: start };
  });

  const progress = currentIdx >= 0 ? (currentIdx + 1) / playlist.length : 0;

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* 제목 */}
      <h1
        className="text-2xl font-black text-center mb-8 break-words px-2"
        style={{ color: "#1E40AF" }}
      >
        📖 {title}
      </h1>

      {/* 본문 */}
      <div className="space-y-8 px-1">
        {sections.length > 0 ? (
          sectionBlocks.map((section) => {
            const meta = SECTION_META[section.type] ?? { label: section.type, bg: "#F3F4F6", color: "#374151" };
            return (
              <div key={section.type}>
                {/* 섹션 구분 */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="text-xs font-black px-3 py-1 rounded-full shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {section.type} · {meta.label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
                </div>

                <div className="space-y-3">
                  {section.paragraphs.map((para, i) => {
                    const gi = section.startIdx + i;
                    const isActive = currentIdx === gi;
                    return (
                      <div
                        key={i}
                        ref={(el) => { paraRefs.current[gi] = el; }}
                        onClick={() => jumpTo(gi)}
                        className="rounded-2xl p-5 cursor-pointer transition-all duration-300"
                        style={{
                          background: isActive ? "#FFF0F8" : "white",
                          border: isActive ? "2px solid #EC4899" : "1.5px solid #E5E7EB",
                          boxShadow: isActive ? "0 0 0 4px rgba(236,72,153,0.08)" : "none",
                          transform: isActive ? "scale(1.01)" : "scale(1)",
                        }}
                      >
                        {isActive && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#EC4899" }} />
                            <span className="text-xs font-bold" style={{ color: "#EC4899" }}>읽는 중</span>
                          </div>
                        )}
                        <p
                          className="break-words"
                          style={{ color: isActive ? "#1F2937" : "#4B5563", lineHeight: "1.9", fontSize: "1rem" }}
                        >
                          {para}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          /* 구버전 pages 렌더링 */
          <div className="space-y-3">
            {legacyPages.map((page, i) => {
              const isActive = currentIdx === i;
              return (
                <div
                  key={i}
                  ref={(el) => { paraRefs.current[i] = el; }}
                  onClick={() => jumpTo(i)}
                  className="rounded-2xl p-5 cursor-pointer transition-all duration-300"
                  style={{
                    background: isActive ? "#FFF0F8" : "white",
                    border: isActive ? "2px solid #EC4899" : "1.5px solid #E5E7EB",
                  }}
                >
                  <p className="break-words" style={{ color: "#4B5563", lineHeight: "1.9" }}>
                    {page.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 교훈 */}
        {moral && (() => {
          const moralIdx = playlist.length - 1;
          const isActive = currentIdx === moralIdx;
          return (
            <div
              ref={(el) => { paraRefs.current[moralIdx] = el; }}
              onClick={() => jumpTo(moralIdx)}
              className="rounded-2xl p-6 cursor-pointer transition-all duration-300"
              style={{
                background: isActive ? "#FFF0F8" : "#FFF5FB",
                border: isActive ? "2px solid #EC4899" : "2px dashed #FBCFE8",
              }}
            >
              <p className="text-xs font-black mb-2" style={{ color: "#BE185D" }}>✨ 이 이야기의 교훈</p>
              <p className="text-base font-semibold break-words" style={{ color: "#374151", lineHeight: "1.8" }}>
                {moral}
              </p>
            </div>
          );
        })()}
      </div>

      {/* 플레이어 컨트롤 — 하단 고정 */}
      <div className="fixed left-0 right-0 flex justify-center z-40" style={{ bottom: 72 }}>
        <div
          className="flex items-center gap-2 rounded-full px-5 py-2.5"
          style={{
            background: "white",
            border: "1.5px solid #FBCFE8",
            boxShadow: "0 8px 32px rgba(236,72,153,0.2)",
          }}
        >
          {/* 처음으로 */}
          <button
            onClick={handleRestart}
            className="p-2 rounded-full hover:bg-pink-50 transition-colors"
            style={{ color: "#9CA3AF" }}
            title="처음으로"
          >
            <RotateCcw size={15} />
          </button>

          {/* 이전 문단 */}
          <button
            onClick={() => jumpTo(Math.max(0, (currentIdx > 0 ? currentIdx : 1) - 1))}
            className="p-2 rounded-full hover:bg-pink-50 transition-colors"
            style={{ color: currentIdx <= 0 ? "#D1D5DB" : "#9CA3AF" }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* 재생 / 일시정지 */}
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{
              background: "linear-gradient(135deg, #EC4899, #C026D3)",
              color: "white",
              boxShadow: "0 4px 16px rgba(236,72,153,0.4)",
            }}
          >
            {playing ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
          </button>

          {/* 다음 문단 */}
          <button
            onClick={() => jumpTo(Math.min(playlist.length - 1, (currentIdx >= 0 ? currentIdx : 0) + 1))}
            className="p-2 rounded-full hover:bg-pink-50 transition-colors"
            style={{ color: currentIdx >= playlist.length - 1 ? "#D1D5DB" : "#9CA3AF" }}
          >
            <ChevronRight size={18} />
          </button>

          {/* 진행 바 */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#F3F4F6" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress * 100}%`,
                  background: "linear-gradient(90deg, #EC4899, #C026D3)",
                }}
              />
            </div>
            <span className="text-xs font-bold" style={{ color: "#9CA3AF", minWidth: "2.5rem", textAlign: "right" }}>
              {currentIdx >= 0 ? `${currentIdx + 1}/${playlist.length}` : `–/${playlist.length}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
