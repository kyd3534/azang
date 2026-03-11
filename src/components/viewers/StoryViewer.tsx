"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square, RotateCcw } from "lucide-react";
import { useVoice } from "@/lib/voice-context";
import type { StorySection } from "@/ai/flows/story";

/* ── 동화 전용 한국어 TTS ──────────────────────────────────────────────────────
 * speak() 유틸은 긴 단일 utterance를 Chrome이 묵음 처리하는 문제가 있어
 * 문장별 체인 방식으로 직접 구현. "interrupted" 오류는 체인 중 Chrome이 뱉는
 * spurious error이므로 abort하지 않고 다음 문장으로 넘어감.
 */
function speakKoreanStory(text: string, opts: { gender?: "female" | "male"; onDone: () => void }): () => void {
  const { gender, onDone } = opts;
  if (typeof window === "undefined" || !window.speechSynthesis) { onDone(); return () => {}; }
  const synth = window.speechSynthesis;

  // 문장 분리 (마침표/물음표/느낌표 뒤 공백 or 줄바꿈)
  const sentences = text
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(s => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) { onDone(); return () => {}; }

  let idx = 0;
  let stopped = false;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  function getKoVoice() {
    const voices = synth.getVoices();
    if (gender === "male") {
      return (
        voices.find(v => v.name.toLowerCase().includes("ko-kr-neural2-c")) ??
        voices.find(v => v.name.toLowerCase().includes("ko-kr-standard-c")) ??
        voices.find(v => v.lang === "ko-KR") ??
        voices.find(v => v.lang.startsWith("ko")) ??
        null
      );
    }
    return (
      voices.find(v => v.lang === "ko-KR") ??
      voices.find(v => v.lang.startsWith("ko")) ??
      null
    );
  }

  const rate = gender === "male" ? 0.80 : 0.80;
  const pitch = gender === "male" ? 0.82 : 1.00;

  function next() {
    if (stopped || idx >= sentences.length) {
      if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
      if (!stopped) onDone();
      return;
    }
    const sentence = sentences[idx++];
    const voice = getKoVoice();
    const utter = new SpeechSynthesisUtterance(sentence);
    if (voice) utter.voice = voice;
    utter.lang = "ko-KR";
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = 1;

    // 첫 문장에서 keepAlive 시작
    if (idx === 1) {
      utter.onstart = () => {
        keepAlive = setInterval(() => {
          if (synth.speaking) { synth.pause(); synth.resume(); }
          else { clearInterval(keepAlive!); keepAlive = null; }
        }, 8000);
      };
    }
    utter.onend = () => { if (!stopped) setTimeout(next, 80); };
    utter.onerror = (e) => {
      // "canceled" = 명시적 stop → 체인 종료
      // "interrupted" = Chrome spurious error → 다음 문장으로 계속
      if ((e as SpeechSynthesisErrorEvent).error === "canceled") {
        stopped = true;
        if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
        return;
      }
      if (!stopped) setTimeout(next, 150);
    };
    synth.speak(utter);
  }

  // 이미 말하고 있으면 cancel 후 300ms 대기, idle이면 cancel 없이 바로 시작
  function start() {
    if (synth.speaking || synth.pending) {
      synth.cancel();
      setTimeout(next, 300);
    } else {
      setTimeout(next, 50);
    }
  }

  const voices = synth.getVoices();
  if (voices.length > 0) {
    start();
  } else {
    let fired = false;
    const once = () => { if (!fired) { fired = true; start(); } };
    synth.addEventListener("voiceschanged", once, { once: true });
    setTimeout(() => { if (!fired && synth.getVoices().length > 0) once(); }, 1000);
  }

  return () => {
    stopped = true;
    if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
    synth.cancel();
  };
}

const SECTION_META: Record<string, { label: string; bg: string; color: string }> = {
  기: { label: "이야기의 시작", bg: "#DBEAFE", color: "#1D4ED8" },
  승: { label: "이야기 전개",   bg: "#D1FAE5", color: "#065F46" },
  전: { label: "위기와 반전",   bg: "#FEF3C7", color: "#92400E" },
  결: { label: "행복한 결말",   bg: "#FCE7F3", color: "#BE185D" },
};

function buildFullText(
  sections: StorySection[],
  legacyPages: { text: string }[],
  moral: string,
): string {
  const parts: string[] = [];
  if (sections.length > 0) {
    for (const s of sections) {
      for (const para of s.paragraphs) {
        parts.push(para);
      }
    }
  } else {
    for (const p of legacyPages) {
      parts.push(p.text);
    }
  }
  if (moral) parts.push(`이 이야기의 교훈: ${moral}`);
  return parts.join(" ");
}

interface StoryViewerProps {
  title: string;
  sections: StorySection[];
  legacyPages: { pageNumber: number; text: string; imagePrompt: string }[];
  moral: string;
}

export default function StoryViewer({ title, sections, legacyPages, moral }: StoryViewerProps) {
  const { stop, tts, selectedVoiceId } = useVoice();
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const fullText = buildFullText(sections, legacyPages, moral);
  const sectionBlocks = sections.map((s) => s);
  const isPlaying = playing;

  // 마운트 시 voices 미리 로드
  useEffect(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.getVoices();
  }, []);

  function handlePlay() {
    setPlaying(true);
    const isElevenLabs =
      selectedVoiceId !== "" &&
      selectedVoiceId !== "__female__" &&
      selectedVoiceId !== "__male__";

    if (isElevenLabs) {
      tts(fullText, { lang: "ko", raw: true, onEnd: () => setPlaying(false) });
      stopRef.current = () => stop();
    } else {
      const gender = selectedVoiceId === "__male__" ? "male" : "female";
      stopRef.current = speakKoreanStory(fullText, { gender, onDone: () => setPlaying(false) });
    }
  }

  function handleStop() {
    stopRef.current?.();
    stopRef.current = null;
    stop();
    setPlaying(false);
  }

  return (
    <div className="max-w-2xl mx-auto pb-28">
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
          sectionBlocks.map((section, si) => {
            const meta = SECTION_META[section.type] ?? { label: section.type, bg: "#F3F4F6", color: "#374151" };
            return (
              <div key={si}>
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
                  {section.paragraphs.map((para, i) => (
                    <div
                      key={i}
                      className="rounded-2xl p-5"
                      style={{ background: "white", border: "1.5px solid #E5E7EB" }}
                    >
                      <p className="break-words" style={{ color: "#4B5563", lineHeight: "1.9", fontSize: "1rem" }}>
                        {para}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="space-y-3">
            {legacyPages.map((page, i) => (
              <div key={i} className="rounded-2xl p-5"
                style={{ background: "white", border: "1.5px solid #E5E7EB" }}>
                <p className="break-words" style={{ color: "#4B5563", lineHeight: "1.9" }}>{page.text}</p>
              </div>
            ))}
          </div>
        )}

        {moral && (
          <div className="rounded-2xl p-6" style={{ background: "#FFF5FB", border: "2px dashed #FBCFE8" }}>
            <p className="text-xs font-black mb-2" style={{ color: "#BE185D" }}>✨ 이 이야기의 교훈</p>
            <p className="text-base font-semibold break-words" style={{ color: "#374151", lineHeight: "1.8" }}>
              {moral}
            </p>
          </div>
        )}
      </div>

      {/* 플레이어 컨트롤 — 하단 고정 */}
      <div className="fixed left-0 right-0 flex justify-center z-40" style={{ bottom: 72 }}>
        <div
          className="flex items-center gap-3 rounded-full px-6 py-3"
          style={{
            background: "white",
            border: "1.5px solid #FBCFE8",
            boxShadow: "0 8px 32px rgba(236,72,153,0.2)",
          }}
        >
          {/* 처음부터 */}
          <button
            onClick={handleStop}
            className="p-2 rounded-full hover:bg-pink-50 transition-colors"
            style={{ color: "#9CA3AF" }}
            title="정지"
          >
            <RotateCcw size={16} />
          </button>

          {/* 재생 / 정지 */}
          <button
            onClick={isPlaying ? handleStop : handlePlay}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
            style={{
              background: isPlaying
                ? "linear-gradient(135deg, #F43F5E, #EC4899)"
                : "linear-gradient(135deg, #EC4899, #C026D3)",
              color: "white",
              boxShadow: "0 4px 16px rgba(236,72,153,0.4)",
            }}
          >
            {isPlaying
              ? <Square size={20} fill="white" />
              : <Play size={22} style={{ marginLeft: 3 }} />}
          </button>

          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-5">
              {[2, 4, 3, 5, 2, 4, 3].map((h, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    width: 3,
                    borderRadius: 2,
                    background: "#EC4899",
                    height: h * 3,
                    animation: `tts-wave 0.7s ease-in-out ${i * 0.1}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="text-sm font-bold" style={{ color: "#9CA3AF" }}>전체 듣기</span>
          )}
        </div>
      </div>
    </div>
  );
}
