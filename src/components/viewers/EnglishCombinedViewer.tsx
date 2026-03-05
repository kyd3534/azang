"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Play, Square, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/ui/SpeakButton";
import { useVoice } from "@/lib/voice-context";
import { speakDialogue } from "@/lib/tts";
import type { CombinedOutput } from "@/ai/flows/english";

interface Props { data: CombinedOutput; }

export default function EnglishCombinedViewer({ data }: Props) {
  const [expandedWord, setExpandedWord] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);
  const { tts } = useVoice();

  const hasDialogue = data.dialogue && data.dialogue.length > 0;

  function handlePlayAll() {
    if (!data.dialogue?.length) return;
    // 이미 재생 중이면 먼저 정지
    stopRef.current?.();
    setIsPlaying(true);

    stopRef.current = speakDialogue(
      data.dialogue.map((l) => ({
        text: l.text,
        gender: (l.speaker === "A" ? "female" : "male") as "female" | "male",
      })),
      () => {
        setIsPlaying(false);
        stopRef.current = null;
      }
    );
  }

  function handleStop() {
    stopRef.current?.();
    stopRef.current = null;
    setIsPlaying(false);
  }

  function handleLineSpeech(text: string, gender: "female" | "male") {
    if (isPlaying) handleStop();
    tts(text, { lang: "en", gender });
  }

  return (
    <div className="max-w-lg">
      {/* ── 단어 섹션 ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📚</span>
          <h2 className="text-lg font-black text-indigo-800">단어</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: "#EDE9FE", color: "#6366F1" }}>
            {data.words.length}개
          </span>
        </div>

        <div className="space-y-2">
          {data.words.map((w, i) => (
            <motion.div key={i} layout className="rounded-2xl overflow-hidden"
              style={{ background: "white", border: "2px solid #EDE9FE" }}>
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedWord(expandedWord === i ? null : i)}
              >
                <span className="text-4xl flex-shrink-0">{w.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-black text-indigo-900">{w.word}</span>
                    <span className="text-xs text-indigo-400 font-medium">[{w.pronunciation}]</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{w.meaning}</span>
                </div>
                <SpeakButton
                  text={w.word}
                  lang="en"
                  className="p-2 rounded-xl flex-shrink-0"
                  style={{ background: "#EDE9FE", color: "#6366F1" }}
                  iconSize={16}
                />
                <span className="text-indigo-300 flex-shrink-0">
                  {expandedWord === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              <AnimatePresence>
                {expandedWord === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <div className="rounded-xl p-3 flex items-start justify-between gap-3"
                        style={{ background: "#F5F3FF" }}>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-indigo-700 break-words">{w.exampleSentence}</p>
                          <p className="text-xs text-indigo-400 mt-0.5 break-words">{w.exampleTranslation}</p>
                        </div>
                        <SpeakButton
                          text={w.exampleSentence}
                          lang="en"
                          className="p-1.5 rounded-lg flex-shrink-0"
                          style={{ background: "#EDE9FE", color: "#6366F1" }}
                          iconSize={14}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 대화 섹션 ── */}
      {hasDialogue && (
        <div className="pt-6 border-t-2" style={{ borderColor: "#EDE9FE" }}>
          <div className="flex items-center justify-between mb-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl">💬</span>
              <h2 className="text-lg font-black text-indigo-800">대화</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "#EDE9FE", color: "#6366F1" }}>♀ A</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: "#FCE7F3", color: "#BE185D" }}>♂ B</span>
            </div>

            {/* 재생 / 정지 버튼 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={handlePlayAll}
                disabled={isPlaying}
                style={{
                  background: isPlaying ? "#E0E7FF" : "linear-gradient(135deg,#818CF8,#6366F1)",
                  color: isPlaying ? "#6366F1" : "white",
                  border: "none",
                  opacity: isPlaying ? 0.7 : 1,
                }}
              >
                <Play size={13} className="mr-1" />
                {isPlaying ? "재생 중..." : "전체 재생"}
              </Button>
              <Button
                size="sm"
                onClick={handleStop}
                disabled={!isPlaying}
                style={{
                  background: isPlaying ? "linear-gradient(135deg,#F87171,#EF4444)" : "#F3F4F6",
                  color: isPlaying ? "white" : "#9CA3AF",
                  border: "none",
                  opacity: isPlaying ? 1 : 0.5,
                }}
              >
                <Square size={11} className="mr-1" fill="currentColor" />
                정지
              </Button>
            </div>
          </div>

          {data.situation && (
            <div className="rounded-xl px-4 py-2.5 mb-4 text-sm font-medium text-indigo-600"
              style={{ background: "#F5F3FF", border: "1px solid #EDE9FE" }}>
              📍 {data.situation}
            </div>
          )}

          <div className="space-y-3">
            {data.dialogue!.map((line, i) => {
              const isA = line.speaker === "A";
              const gender: "female" | "male" = isA ? "female" : "male";
              return (
                <motion.div key={i} initial={{ x: isA ? -16 : 16, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={`flex gap-2.5 ${isA ? "" : "flex-row-reverse"}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={isA
                      ? { background: "#EDE9FE", color: "#6366F1" }
                      : { background: "#FCE7F3", color: "#EC4899" }}>
                    {line.speakerName.charAt(0).toUpperCase()}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${isA ? "" : "flex flex-col items-end"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold"
                        style={{ color: isA ? "#818CF8" : "#EC4899" }}>
                        {line.speakerName}
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={isA
                          ? { background: "#EDE9FE", color: "#6366F1" }
                          : { background: "#FCE7F3", color: "#BE185D" }}>
                        {isA ? "♀" : "♂"}
                      </span>
                    </div>
                    <div className="rounded-2xl px-4 py-2.5 inline-block"
                      style={isA
                        ? { background: "#F5F3FF", border: "1.5px solid #EDE9FE" }
                        : { background: "#FDF2F8", border: "1.5px solid #FBCFE8" }}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold break-words"
                            style={{ color: isA ? "#3730A3" : "#9D174D" }}>{line.text}</p>
                          <p className="text-xs mt-0.5 break-words"
                            style={{ color: isA ? "#818CF8" : "#EC4899" }}>{line.translation}</p>
                        </div>
                        {/* 개별 줄 재생 버튼 */}
                        <SpeakButton
                          text={line.text}
                          lang="en"
                          className="p-1.5 rounded-lg flex-shrink-0 active:scale-90 transition-transform"
                          style={isA
                            ? { background: "#EDE9FE", color: "#6366F1" }
                            : { background: "#FCE7F3", color: "#EC4899" }}
                          iconSize={12}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
