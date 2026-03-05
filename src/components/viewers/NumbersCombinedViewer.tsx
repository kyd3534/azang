"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import SpeakButton from "@/components/ui/SpeakButton";
import { useVoice } from "@/lib/voice-context";
import type { NumbersCombinedOutput } from "@/ai/flows/numbers";

function playTone(freqs: number[], type: OscillatorType = "sine") {
  try {
    const ctx = new AudioContext();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.15;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.3);
    });
  } catch { /* ignore */ }
}

interface Props { data: NumbersCombinedOutput; }

export default function NumbersCombinedViewer({ data }: Props) {
  const [expandedNum, setExpandedNum] = useState<number | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);
  useVoice(); // context 연결 유지

  const hasStories = data.stories && data.stories.length > 0;

  function revealAnswer(i: number) {
    if (revealedAnswers.includes(i)) return;
    setRevealedAnswers((prev) => [...prev, i]);
    playTone([523, 659, 784]);
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* ── 숫자 카드 섹션 ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔢</span>
          <h2 className="text-lg font-black text-amber-800">숫자</h2>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: "#FFF3C8", color: "#F57F17" }}>
            {data.numbers.length}개
          </span>
        </div>

        <div className="space-y-2">
          {data.numbers.map((num, i) => (
            <motion.div key={i} layout className="rounded-2xl overflow-hidden"
              style={{ background: "white", border: "2px solid #FFF3C8" }}>
              {/* Card row — div로 변경하여 nested button 방지 */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedNum(expandedNum === i ? null : i)}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-2xl"
                  style={{ background: "linear-gradient(135deg,#FFD740,#FF8F00)", color: "white" }}>
                  {num.value}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl mb-0.5 break-all leading-tight">{num.emoji}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-amber-800">{num.korean}</span>
                    <span className="text-xs text-amber-400 font-semibold">{num.english}</span>
                  </div>
                </div>
                <SpeakButton
                  text={`${num.value}, ${num.korean}`}
                  lang="ko"
                  className="p-2 rounded-xl flex-shrink-0"
                  style={{ background: "#FFF3C8", color: "#F57F17" }}
                  iconSize={16}
                />
                <span className="text-amber-300 flex-shrink-0">
                  {expandedNum === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>

              <AnimatePresence>
                {expandedNum === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <div className="rounded-xl p-4 text-center" style={{ background: "#FFFBEB" }}>
                        <div className="text-3xl mb-2 break-all">{num.emoji}</div>
                        <p className="text-sm font-bold text-amber-700">{num.description}</p>
                        <div className="flex justify-center gap-4 mt-3 text-xs font-bold">
                          <span style={{ color: "#F57F17" }}>🇰🇷 {num.korean}</span>
                          <span style={{ color: "#1565C0" }}>🇺🇸 {num.english}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 수학 이야기 섹션 ── */}
      {hasStories && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📚</span>
            <h2 className="text-lg font-black text-amber-800">수학 이야기</h2>
          </div>

          <div className="space-y-4">
            {data.stories.map((story, i) => {
              const revealed = revealedAnswers.includes(i);
              return (
                <motion.div key={i} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08 }} className="rounded-2xl overflow-hidden"
                  style={{ background: "white", border: "2px solid #FFF3C8" }}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl flex-shrink-0">{story.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-amber-900 leading-relaxed">{story.text}</p>
                        <SpeakButton
                          text={story.text}
                          lang="ko"
                          className="mt-1.5 p-1.5 rounded-lg"
                          style={{ background: "#FFF3C8", color: "#F57F17" }}
                          iconSize={13}
                        />
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl px-4 py-2.5"
                      style={{ background: "#FFFBEB", border: "1.5px dashed #FCD34D" }}>
                      <p className="text-sm font-black text-amber-700">❓ {story.question}</p>
                    </div>

                    {!revealed ? (
                      <button onClick={() => revealAnswer(i)}
                        className="mt-3 w-full py-2.5 rounded-xl text-sm font-black transition-all"
                        style={{ background: "linear-gradient(135deg,#FFD740,#FF8F00)", color: "white", border: "none" }}>
                        정답 확인하기 ✨
                      </button>
                    ) : (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="mt-3 rounded-xl p-3"
                        style={{ background: "#DCFCE7", border: "1.5px solid #86EFAC" }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-green-600 font-black text-lg">✓</span>
                          <span className="text-sm font-black text-green-700">{story.answer}</span>
                          <SpeakButton
                            text={story.answer}
                            lang="ko"
                            className="p-1 rounded-lg ml-auto"
                            style={{ background: "#D6F5EE", color: "#2E7D32" }}
                            iconSize={12}
                          />
                        </div>
                        <p className="text-xs font-bold text-green-600">{story.explanation}</p>
                      </motion.div>
                    )}
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
