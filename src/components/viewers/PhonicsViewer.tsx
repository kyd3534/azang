"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import SpeakButton from "@/components/ui/SpeakButton";
import { useVoice } from "@/lib/voice-context";
import type {
  AlphabetPhonicsOutput,
  PhonicsSystematicOutput,
  ReadingFluencyOutput,
  AcademicLiteracyOutput,
} from "@/ai/flows/english";

type PhonicsData =
  | AlphabetPhonicsOutput
  | PhonicsSystematicOutput
  | ReadingFluencyOutput
  | AcademicLiteracyOutput;

interface Props { data: PhonicsData; }

// 색깔 맵
const COLOR_MAP: Record<string, string> = {
  blue: "#3B82F6",
  red: "#EF4444",
  green: "#22C55E",
  purple: "#A855F7",
};

export default function PhonicsViewer({ data }: Props) {
  const { tts } = useVoice();
  const [expandedVocab, setExpandedVocab] = useState<number | null>(null);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [isReadingPassage, setIsReadingPassage] = useState(false);

  function readPassage(text: string) {
    if (isReadingPassage) return;
    setIsReadingPassage(true);
    tts(text, { lang: "en", onEnd: () => setIsReadingPassage(false) });
  }

  // ═══════════════════════════════════════════════
  // 🐥 3-4세 — Alphabet Phonics
  // ═══════════════════════════════════════════════
  if (data.contentType === "alphabet_phonics") {
    const d = data as AlphabetPhonicsOutput;
    return (
      <div className="max-w-lg space-y-5">
        {/* 오늘의 Letter */}
        <div className="rounded-3xl p-6 text-center shadow-md"
          style={{ background: "linear-gradient(135deg, #E6F1FB, #EDE9FE)" }}>
          <div className="text-7xl font-black mb-2" style={{ color: "#185FA5" }}>
            {d.letter.char}
          </div>
          <div className="text-lg font-bold mb-1" style={{ color: "#3730A3" }}>
            {d.letter.sound}
          </div>
          <div className="text-sm font-medium mb-3" style={{ color: "#6366F1" }}>
            {d.letter.mnemonic}
          </div>
          <div className="text-xs px-3 py-1.5 rounded-xl inline-block mb-3"
            style={{ background: "#E6F1FB", color: "#185FA5" }}>
            👄 {d.letter.mouth_tip}
          </div>
          <div>
            <SpeakButton
              text={d.letter.tts_intro}
              lang="en"
              className="mx-auto px-5 py-2 rounded-2xl font-bold text-white"
              style={{ background: "linear-gradient(135deg, #818CF8, #6366F1)" }}
              iconSize={16}
            />
          </div>
        </div>

        {/* Sight Word */}
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#F5F3FF", border: "2px solid #EDE9FE" }}>
          <span className="text-2xl">👁</span>
          <div className="flex-1">
            <div className="text-xs font-bold mb-1" style={{ color: "#6366F1" }}>TODAY'S SIGHT WORD</div>
            <div className="text-2xl font-black" style={{ color: "#3730A3" }}>{d.sight_word.word}</div>
            <div className="text-sm mt-0.5" style={{ color: "#818CF8" }}>{d.sight_word.sentence}</div>
          </div>
          <SpeakButton text={d.sight_word.word} lang="en" iconSize={16}
            className="p-2 rounded-xl" style={{ background: "#EDE9FE", color: "#6366F1" }} />
        </div>

        {/* 단어 카드 */}
        <div>
          <div className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "#6366F1" }}>
            📚 CVC 단어 4개
          </div>
          <div className="space-y-2">
            {d.words.map((w, i) => (
              <div key={i} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "white", border: "2px solid #EDE9FE" }}>
                <span className="text-3xl">{w.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    {/* 음소 색깔 분해 */}
                    {[...w.word].map((ch, ci) => (
                      <span key={ci} className="text-xl font-black"
                        style={{ color: COLOR_MAP[w.breakdown.colors?.[ci] ?? "blue"] ?? "#3B82F6" }}>
                        {ch}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: "#818CF8" }}>
                    {w.breakdown.onset} · {w.breakdown.rime}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#6366F1" }}>{w.example_sentence}</div>
                </div>
                <SpeakButton text={w.word} lang="en" iconSize={14}
                  className="p-2 rounded-xl" style={{ background: "#EDE9FE", color: "#6366F1" }} />
              </div>
            ))}
          </div>
        </div>

        {/* 이야기 */}
        <div className="rounded-2xl p-4" style={{ background: "#F0F9FF", border: "2px solid #BAE6FD" }}>
          <div className="text-xs font-bold mb-2" style={{ color: "#0369A1" }}>📖 {d.story.title}</div>
          <div className="space-y-1">
            {d.story.lines.map((line, i) => (
              <div key={i} className="text-sm font-medium" style={{ color: "#0C4A6E" }}>{line}</div>
            ))}
          </div>
          {d.story.repeat_phrase && (
            <div className="mt-3 px-3 py-1.5 rounded-xl text-sm font-bold text-center"
              style={{ background: "#BAE6FD", color: "#0369A1" }}>
              🔁 {d.story.repeat_phrase}
            </div>
          )}
        </div>

        {/* 운율 세트 */}
        <div className="rounded-2xl p-4" style={{ background: "#FDF4FF", border: "2px solid #F0ABFC" }}>
          <div className="text-xs font-bold mb-2" style={{ color: "#86198F" }}>🎵 Rhyme Set</div>
          <div className="flex gap-2 flex-wrap">
            {d.rhyme_set.map((rw, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-sm font-bold cursor-pointer"
                style={{ background: "#F0ABFC", color: "#86198F" }}
                onClick={() => tts(rw, { lang: "en" })}>
                {rw}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // 🐰 5-6세 — Phonics Systematic
  // ═══════════════════════════════════════════════
  if (data.contentType === "phonics_systematic") {
    const d = data as PhonicsSystematicOutput;
    return (
      <div className="max-w-lg space-y-5">
        {/* 파닉스 포커스 */}
        <div className="rounded-3xl p-5 shadow-md"
          style={{ background: "linear-gradient(135deg, #DCFCE7, #D1FAE5)" }}>
          <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#065F46" }}>
            🎯 TODAY'S PHONICS FOCUS
          </div>
          <div className="text-xl font-black mb-1" style={{ color: "#047857" }}>
            {d.focus.pattern.replace(/_/g, " ").toUpperCase()}
          </div>
          <div className="text-sm mb-3" style={{ color: "#065F46" }}>{d.focus.rule_plain}</div>
          {/* 색깔 분해 */}
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {d.focus.color_decode.parts.map((p, i) => (
              <span key={i} className="text-2xl font-black"
                style={{ color: COLOR_MAP[p.color] ?? "#047857" }}>
                {p.char}
              </span>
            ))}
          </div>
          <div className="text-xs" style={{ color: "#065F46" }}>
            🔊 {d.focus.color_decode.blend_guide}
          </div>
        </div>

        {/* Sight Word */}
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#FEF3C7", border: "2px solid #FDE68A" }}>
          <span className="text-2xl">👁</span>
          <div className="flex-1">
            <div className="text-xs font-bold mb-0.5" style={{ color: "#92400E" }}>
              SIGHT WORD — just memorize!
            </div>
            <div className="text-2xl font-black" style={{ color: "#78350F" }}>{d.sight_word.word}</div>
            <div className="text-xs mt-0.5" style={{ color: "#B45309" }}>{d.sight_word.memory_tip}</div>
          </div>
          <SpeakButton text={d.sight_word.word} lang="en" iconSize={14}
            className="p-2 rounded-xl" style={{ background: "#FDE68A", color: "#92400E" }} />
        </div>

        {/* 단어 5개 */}
        <div>
          <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#047857" }}>
            📚 단어 {d.words.length}개
          </div>
          <div className="space-y-2">
            {d.words.map((w, i) => (
              <div key={i} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "white", border: "2px solid #D1FAE5" }}>
                <span className="text-3xl">{w.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-0.5 mb-1">
                    {w.color_parts.map((cp, ci) => (
                      <span key={ci} className="text-xl font-black"
                        style={{ color: COLOR_MAP[cp.color] ?? "#047857" }}>
                        {cp.char}
                      </span>
                    ))}
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "#DCFCE7", color: "#065F46" }}>
                      {w.syllable_count}음절
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: "#047857" }}>{w.example}</div>
                </div>
                <SpeakButton text={w.word} lang="en" iconSize={14}
                  className="p-2 rounded-xl" style={{ background: "#DCFCE7", color: "#047857" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Minimal Pairs */}
        {d.minimal_pairs.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "#FFF7ED", border: "2px solid #FDBA74" }}>
            <div className="text-xs font-bold mb-2" style={{ color: "#C2410C" }}>
              🔬 Sound Lab — 소리 변별
            </div>
            <div className="space-y-2">
              {d.minimal_pairs.map((mp, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base font-black" style={{ color: "#EA580C" }}
                    onClick={() => tts(mp.word_a, { lang: "en" })}>{mp.word_a}</span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>vs</span>
                  <span className="text-base font-black" style={{ color: "#16A34A" }}
                    onClick={() => tts(mp.word_b, { lang: "en" })}>{mp.word_b}</span>
                  <span className="text-xs ml-auto" style={{ color: "#6B7280" }}>{mp.difference}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이야기 */}
        <div className="rounded-2xl p-4" style={{ background: "#F0F9FF", border: "2px solid #BAE6FD" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold" style={{ color: "#0369A1" }}>📖 {d.story.title}</div>
            <SpeakButton text={d.story.lines.join(" ")} lang="en" iconSize={14}
              className="p-1.5 rounded-lg" style={{ background: "#BAE6FD", color: "#0369A1" }} />
          </div>
          <div className="space-y-1">
            {d.story.lines.map((line, i) => (
              <div key={i} className="text-sm" style={{ color: "#0C4A6E" }}>{line}</div>
            ))}
          </div>
          {d.story.comprehension_q && (
            <div className="mt-3 px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: "#E0F2FE", color: "#0369A1" }}>
              ❓ {d.story.comprehension_q}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // 🦊 7-8세 — Reading Fluency
  // ═══════════════════════════════════════════════
  if (data.contentType === "reading_fluency") {
    const d = data as ReadingFluencyOutput;
    return (
      <div className="max-w-lg space-y-5">
        {/* Word Study */}
        <div className="rounded-3xl p-5 shadow-md"
          style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)" }}>
          <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#4338CA" }}>
            🔬 Word Study — {d.word_study.focus.replace(/_/g, " ")}
          </div>
          <div className="text-2xl font-black mb-1" style={{ color: "#3730A3" }}>
            {d.word_study.target}
          </div>
          <div className="text-sm mb-3" style={{ color: "#4338CA" }}>{d.word_study.rule}</div>
          {d.word_study.stress_pattern && (
            <div className="text-xs px-2 py-1 rounded-lg inline-block mb-3"
              style={{ background: "#EDE9FE", color: "#6366F1" }}>
              ♩ {d.word_study.stress_pattern}
            </div>
          )}
          <div className="space-y-1">
            {d.word_study.examples.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-black" style={{ color: "#4338CA" }}>{ex.breakdown}</span>
                <span style={{ color: "#6366F1" }}>→</span>
                <span style={{ color: "#818CF8" }}>{ex.meaning}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 어휘 6개 */}
        <div>
          <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#4338CA" }}>
            📚 어휘 {d.vocabulary.length}개
          </div>
          <div className="space-y-2">
            {d.vocabulary.map((v, i) => (
              <motion.div key={i} layout className="rounded-2xl overflow-hidden"
                style={{ background: "white", border: "2px solid #EDE9FE" }}>
                <div className="p-3 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedVocab(expandedVocab === i ? null : i)}>
                  <span className="text-3xl">{v.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black" style={{ color: "#3730A3" }}>{v.word}</span>
                      <span className="text-xs" style={{ color: "#818CF8" }}>[{v.syllables}]</span>
                      <span className="text-xs px-1.5 rounded" style={{ background: "#EDE9FE", color: "#6366F1" }}>
                        {v.pos}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: "#6366F1" }}>{v.definition}</div>
                  </div>
                  <SpeakButton text={v.word} lang="en" iconSize={14}
                    className="p-1.5 rounded-lg" style={{ background: "#EDE9FE", color: "#6366F1" }} />
                  {expandedVocab === i ? <ChevronUp size={14} style={{ color: "#818CF8" }} /> : <ChevronDown size={14} style={{ color: "#818CF8" }} />}
                </div>
                <AnimatePresence>
                  {expandedVocab === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-3 space-y-2">
                        <div className="text-sm px-3 py-2 rounded-xl" style={{ background: "#F5F3FF", color: "#4338CA" }}>
                          💬 {v.context_clue_sentence}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {v.word_family.map((wf, wi) => (
                            <span key={wi} className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "#EDE9FE", color: "#6366F1" }}>{wf}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 지문 */}
        <div className="rounded-2xl p-5" style={{ background: "#FAFAF9", border: "2px solid #E7E5E4" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-base font-black" style={{ color: "#1C1917" }}>{d.passage.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "#78716C" }}>
                {d.passage.genre} · {d.passage.line_count}줄
              </div>
            </div>
            <button
              onClick={() => readPassage(d.passage.text)}
              disabled={isReadingPassage}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: isReadingPassage ? "#E7E5E4" : "linear-gradient(135deg, #818CF8, #6366F1)",
                color: isReadingPassage ? "#78716C" : "white",
              }}>
              {isReadingPassage ? "읽는 중..." : "▶ 읽기"}
            </button>
          </div>
          <div className="text-sm leading-7 whitespace-pre-line" style={{ color: "#292524" }}>
            {d.passage.text}
          </div>
          {d.passage.fluency_note && (
            <div className="mt-3 text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "#F5F3FF", color: "#6366F1" }}>
              💡 {d.passage.fluency_note}
            </div>
          )}
        </div>

        {/* 이해 질문 */}
        <div className="space-y-3">
          {d.questions.map((q, i) => (
            <div key={i} className="rounded-2xl p-4"
              style={{
                background: q.type === "inferential" ? "#FFF7ED" : "#F0FDF4",
                border: `2px solid ${q.type === "inferential" ? "#FDBA74" : "#BBF7D0"}`,
              }}>
              <div className="text-xs font-bold mb-2"
                style={{ color: q.type === "inferential" ? "#C2410C" : "#15803D" }}>
                {q.type === "literal" ? "📌 사실 질문" : "🧠 추론 질문"}
              </div>
              <div className="text-sm font-bold mb-2" style={{ color: "#1C1917" }}>{q.question}</div>
              {q.thinking_prompt && (
                <div className="text-xs mb-2 italic" style={{ color: "#92400E" }}>
                  💭 {q.thinking_prompt}
                </div>
              )}
              <button
                onClick={() => setShowAnswers((p) => ({ ...p, [i]: !p[i] }))}
                className="text-xs font-bold px-3 py-1 rounded-lg"
                style={{ background: q.type === "inferential" ? "#FED7AA" : "#BBF7D0", color: "#1C1917" }}>
                {showAnswers[i] ? "정답 숨기기" : "정답 보기"}
              </button>
              <AnimatePresence>
                {showAnswers[i] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-2 text-sm" style={{ color: "#374151" }}>
                      {q.answer ?? q.sample_answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Word Web */}
        <div className="rounded-2xl p-4" style={{ background: "#FDF4FF", border: "2px solid #F0ABFC" }}>
          <div className="text-xs font-bold mb-2" style={{ color: "#86198F" }}>🗺 Word Web</div>
          <div className="text-center">
            <span className="px-4 py-2 rounded-full text-base font-black inline-block mb-3"
              style={{ background: "#F0ABFC", color: "#86198F" }}>
              {d.activity.center_word}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {d.activity.branches.map((b, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: "#FAFAF9", border: "1.5px solid #F0ABFC", color: "#86198F" }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // 🦁 9-10세 — Academic Literacy
  // ═══════════════════════════════════════════════
  if (data.contentType === "academic_literacy") {
    const d = data as AcademicLiteracyOutput;
    const TIER_COLORS: Record<number, [string, string]> = {
      1: ["#DCFCE7", "#15803D"],
      2: ["#EDE9FE", "#6D28D9"],
      3: ["#FEE2E2", "#991B1B"],
    };
    return (
      <div className="max-w-lg space-y-5">
        {/* 테마 헤더 */}
        <div className="rounded-2xl px-4 py-3 text-center font-black text-lg"
          style={{ background: "linear-gradient(135deg, #1E3A5F, #1E1B4B)", color: "white" }}>
          🦁 {d.theme}
        </div>

        {/* 어휘 8개 */}
        <div>
          <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "#1E3A5F" }}>
            📚 어휘 {d.vocabulary.length}개
          </div>
          <div className="space-y-2">
            {d.vocabulary.map((v, i) => {
              const [bg, fg] = TIER_COLORS[v.tier] ?? TIER_COLORS[2];
              return (
                <motion.div key={i} layout className="rounded-2xl overflow-hidden"
                  style={{ background: "white", border: `2px solid ${bg}` }}>
                  <div className="p-3 flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedVocab(expandedVocab === i ? null : i)}>
                    <span className="text-2xl">{v.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg font-black" style={{ color: "#1E1B4B" }}>{v.word}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                          style={{ background: bg, color: fg }}>
                          Tier {v.tier}
                        </span>
                        <span className="text-xs" style={{ color: "#6B7280" }}>{v.pos}</span>
                      </div>
                      <div className="text-xs" style={{ color: "#4B5563" }}>{v.definition}</div>
                    </div>
                    <SpeakButton text={v.word} lang="en" iconSize={14}
                      className="p-1.5 rounded-lg" style={{ background: bg, color: fg }} />
                    {expandedVocab === i ? <ChevronUp size={14} style={{ color: "#9CA3AF" }} /> : <ChevronDown size={14} style={{ color: "#9CA3AF" }} />}
                  </div>
                  <AnimatePresence>
                    {expandedVocab === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-3 space-y-2">
                          {v.etymology && (
                            <div className="text-xs px-3 py-2 rounded-xl italic"
                              style={{ background: "#F9FAFB", color: "#6B7280" }}>
                              🏛 {v.etymology}
                            </div>
                          )}
                          <div className="text-sm px-3 py-2 rounded-xl" style={{ background: "#F5F3FF", color: "#4338CA" }}>
                            {v.example_1}
                          </div>
                          <div className="text-sm px-3 py-2 rounded-xl" style={{ background: "#EEF2FF", color: "#3730A3" }}>
                            {v.example_2}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {v.word_family.map((wf, wi) => (
                              <span key={wi} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: bg, color: fg }}>{wf}</span>
                            ))}
                            {v.collocations.map((col, ci) => (
                              <span key={ci} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "#F3F4F6", color: "#6B7280" }}>{col}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 지문 */}
        <div className="rounded-2xl p-5" style={{ background: "#FAFAF9", border: "2px solid #E7E5E4" }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-base font-black" style={{ color: "#1C1917" }}>{d.passage.title}</div>
              <div className="text-xs mt-0.5 flex gap-2 flex-wrap" style={{ color: "#78716C" }}>
                <span>{d.passage.genre}</span>
                <span>·</span>
                <span>{d.passage.text_structure.replace(/_/g, " ")}</span>
                <span>·</span>
                <span>{d.passage.line_count}줄</span>
              </div>
            </div>
            <button
              onClick={() => readPassage(d.passage.text)}
              disabled={isReadingPassage}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{
                background: isReadingPassage ? "#E7E5E4" : "linear-gradient(135deg, #1E3A5F, #4338CA)",
                color: isReadingPassage ? "#78716C" : "white",
              }}>
              {isReadingPassage ? "읽는 중..." : "▶ 읽기"}
            </button>
          </div>
          {d.passage.text_features.topic_sentence && (
            <div className="text-xs mb-3 px-3 py-1.5 rounded-lg"
              style={{ background: "#EDE9FE", color: "#4338CA" }}>
              📌 Topic: {d.passage.text_features.topic_sentence}
            </div>
          )}
          <div className="text-sm leading-7 whitespace-pre-line" style={{ color: "#292524" }}>
            {d.passage.text}
          </div>
        </div>

        {/* 이해 질문 3개 */}
        <div className="space-y-3">
          {d.questions.map((q, i) => {
            const styles: Record<string, [string, string, string]> = {
              literal: ["#F0FDF4", "#BBF7D0", "#15803D"],
              inferential: ["#FFF7ED", "#FED7AA", "#C2410C"],
              critical: ["#FDF4FF", "#F0ABFC", "#86198F"],
            };
            const [bg, badge, fg] = styles[q.type] ?? styles.literal;
            return (
              <div key={i} className="rounded-2xl p-4" style={{ background: bg, border: `2px solid ${badge}` }}>
                <div className="text-xs font-bold mb-2" style={{ color: fg }}>
                  {q.type === "literal" ? "📌 Literal" : q.type === "inferential" ? "🧠 Inferential" : "⚖️ Critical"}
                </div>
                <div className="text-sm font-bold mb-2" style={{ color: "#1C1917" }}>{q.question}</div>
                {q.evidence_prompt && (
                  <div className="text-xs mb-2 italic" style={{ color: fg }}>💭 {q.evidence_prompt}</div>
                )}
                {q.sentence_starters && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {q.sentence_starters.map((s, si) => (
                      <span key={si} className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: badge, color: fg }}>{s}</span>
                    ))}
                  </div>
                )}
                {q.ai_feedback_rubric && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(q.ai_feedback_rubric).map(([pts, desc]) => (
                      <div key={pts} className="text-xs flex gap-2"
                        style={{ color: "#4B5563" }}>
                        <span className="font-bold w-6 flex-shrink-0">{pts}:</span>
                        <span>{desc}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(q.answer ?? q.sample_answer) && (
                  <>
                    <button
                      onClick={() => setShowAnswers((p) => ({ ...p, [i]: !p[i] }))}
                      className="mt-2 text-xs font-bold px-3 py-1 rounded-lg"
                      style={{ background: badge, color: fg }}>
                      {showAnswers[i] ? "답 숨기기" : "답 보기"}
                    </button>
                    <AnimatePresence>
                      {showAnswers[i] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-2 text-sm" style={{ color: "#374151" }}>
                            {q.answer ?? q.sample_answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Fill in Blank */}
        {d.fill_in_blank.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "#F8FAFC", border: "2px solid #CBD5E1" }}>
            <div className="text-xs font-bold mb-2" style={{ color: "#475569" }}>✍️ Fill in the Blank</div>
            <div className="space-y-2">
              {d.fill_in_blank.map((s, i) => (
                <div key={i} className="text-sm py-2 px-3 rounded-xl"
                  style={{ background: "white", border: "1px solid #E2E8F0", color: "#1E293B" }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extension */}
        {d.extension?.prompt && (
          <div className="rounded-2xl p-4" style={{ background: "#F0FDF4", border: "2px dashed #86EFAC" }}>
            <div className="text-xs font-bold mb-1" style={{ color: "#15803D" }}>🔍 More to Explore</div>
            <div className="text-sm" style={{ color: "#166534" }}>{d.extension.prompt}</div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
