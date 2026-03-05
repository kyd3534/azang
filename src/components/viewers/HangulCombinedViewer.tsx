"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Play, Square, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/ui/SpeakButton";
import { useVoice } from "@/lib/voice-context";
import type { HangulCombinedOutput } from "@/ai/flows/hangul";

const SYLLABLE_COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#9C27B0", "#FF5722"];

interface Props { data: HangulCombinedOutput; }

export default function HangulCombinedViewer({ data }: Props) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [showAnswers, setShowAnswers] = useState<number[]>([]);
  const { tts, stop } = useVoice();

  const hasPassage = data.passage && data.passage.trim().length > 0;
  const hasComprehension = data.comprehension && data.comprehension.length > 0;

  function handleReadAll() {
    if (!hasPassage) return;
    stop();
    setIsReading(true);
    tts(data.passage, { lang: "ko", onEnd: () => setIsReading(false) });
  }

  function handleStop() {
    stop();
    setIsReading(false);
  }

  function toggleAnswer(i: number) {
    setShowAnswers((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* ── 단어/글자 섹션 ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📖</span>
          <h2 className="text-lg font-black text-emerald-800">낱말</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: "#D6F5EE", color: "#2E7D32" }}>
            {data.items.length}개
          </span>
        </div>

        <div className="space-y-2">
          {data.items.map((item, i) => (
            <motion.div key={i} layout className="rounded-2xl overflow-hidden"
              style={{ background: "white", border: "2px solid #D6F5EE" }}>
              {/* Card row — div로 변경하여 nested button 방지 */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedItem(expandedItem === i ? null : i)}
              >
                <span className="text-4xl flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1 flex-wrap">
                    {item.syllables.length > 0
                      ? item.syllables.map((syl, si) => (
                          <span key={si} className="text-xl font-black px-1 rounded"
                            style={{ color: SYLLABLE_COLORS[si % SYLLABLE_COLORS.length] }}>
                            {syl}
                          </span>
                        ))
                      : <span className="text-xl font-black text-emerald-900">{item.char}</span>
                    }
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{item.meaning}</span>
                </div>
                <SpeakButton
                  text={item.char}
                  lang="ko"
                  className="p-2 rounded-xl flex-shrink-0"
                  style={{ background: "#D6F5EE", color: "#2E7D32" }}
                  iconSize={16}
                />
                <span className="text-emerald-300 flex-shrink-0">
                  {expandedItem === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              <AnimatePresence>
                {expandedItem === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-center gap-2 mb-3 py-2 rounded-xl"
                        style={{ background: "#F0FDF4" }}>
                        {item.syllables.map((syl, si) => (
                          <span key={si} className="text-3xl font-black"
                            style={{ color: SYLLABLE_COLORS[si % SYLLABLE_COLORS.length] }}>
                            {syl}
                          </span>
                        ))}
                      </div>
                      <div className="rounded-xl p-3 flex items-start justify-between gap-2"
                        style={{ background: "#F0FDF4" }}>
                        <p className="text-sm font-bold text-emerald-700 break-words">{item.exampleSentence}</p>
                        <SpeakButton
                          text={item.exampleSentence}
                          lang="ko"
                          className="p-1.5 rounded-lg flex-shrink-0"
                          style={{ background: "#D6F5EE", color: "#2E7D32" }}
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

      {/* ── 읽기 지문 섹션 ── */}
      {hasPassage && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h2 className="text-lg font-black text-emerald-800">읽기</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" onClick={handleReadAll} disabled={isReading}
                style={{
                  background: isReading ? "#D1FAE5" : "linear-gradient(135deg,#4CAF50,#2E7D32)",
                  color: isReading ? "#2E7D32" : "white",
                  border: "none",
                  opacity: isReading ? 0.7 : 1,
                }}>
                <Play size={13} className="mr-1" />
                {isReading ? "읽는 중..." : "전체 읽기"}
              </Button>
              <Button size="sm" onClick={handleStop} disabled={!isReading}
                style={{
                  background: isReading ? "linear-gradient(135deg,#F87171,#EF4444)" : "#F3F4F6",
                  color: isReading ? "white" : "#9CA3AF",
                  border: "none",
                  opacity: isReading ? 1 : 0.5,
                }}>
                <Square size={11} className="mr-1" fill="currentColor" />
                정지
              </Button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "white", border: "2px solid #D6F5EE" }}>
            <p className="text-base leading-relaxed text-emerald-900 font-medium whitespace-pre-line">
              {data.passage}
            </p>
          </div>

          {hasComprehension && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💡</span>
                <h3 className="text-base font-black text-emerald-700">이해 확인</h3>
              </div>
              {data.comprehension.map((q, i) => (
                <motion.div key={i} layout className="rounded-2xl overflow-hidden"
                  style={{ background: "white", border: "2px solid #D6F5EE" }}>
                  <div
                    className="px-4 py-3 flex items-center justify-between gap-2 cursor-pointer"
                    onClick={() => toggleAnswer(i)}
                  >
                    <span className="text-sm font-bold text-emerald-800">Q{i + 1}. {q.question}</span>
                    <span className="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0"
                      style={showAnswers.includes(i)
                        ? { background: "#D6F5EE", color: "#2E7D32" }
                        : { background: "#F0FDF4", color: "#86EFAC" }
                      }>
                      {showAnswers.includes(i) ? "숨기기" : "정답 보기"}
                    </span>
                  </div>
                  <AnimatePresence>
                    {showAnswers.includes(i) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-4 pb-3 flex items-center gap-2">
                          <span className="text-green-500 font-black">✓</span>
                          <p className="text-sm font-bold text-emerald-700">{q.answer}</p>
                          <SpeakButton
                            text={q.answer}
                            lang="ko"
                            className="p-1 rounded-lg ml-auto"
                            style={{ background: "#D6F5EE", color: "#2E7D32" }}
                            iconSize={12}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
