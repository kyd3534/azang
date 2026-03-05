"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import WordQuizMode from "./WordQuizMode";
import SpellingMode from "./SpellingMode";
import ListenMode from "./ListenMode";
import MatchingMode from "./MatchingMode";

export interface PracticeWord {
  word: string;
  meaning: string;
  emoji: string;
  pronunciation?: string;
}

type Mode = "hub" | "quiz" | "listen" | "spelling" | "matching";
type AgeGroup = "1-2" | "3-4" | "5-6" | "7-8" | "9-10";
type Subject = "english" | "hangul" | "numbers";

const AGE_GROUPS = [
  { value: "1-2" as AgeGroup, label: "1-2세", emoji: "🍼" },
  { value: "3-4" as AgeGroup, label: "3-4세", emoji: "🐥" },
  { value: "5-6" as AgeGroup, label: "5-6세", emoji: "🐰" },
  { value: "7-8" as AgeGroup, label: "7-8세", emoji: "🦊" },
  { value: "9-10" as AgeGroup, label: "9-10세", emoji: "🦁" },
];

const AGE_CONFIG: Record<AgeGroup, { pairs: number; choices: number }> = {
  "1-2": { pairs: 2, choices: 2 },
  "3-4": { pairs: 3, choices: 2 },
  "5-6": { pairs: 4, choices: 4 },
  "7-8": { pairs: 4, choices: 4 },
  "9-10": { pairs: 4, choices: 4 },
};

const BASE_MODES: Record<AgeGroup, string[]> = {
  "1-2": ["matching"],
  "3-4": ["matching", "listen"],
  "5-6": ["quiz", "listen", "matching"],
  "7-8": ["quiz", "listen", "spelling", "matching"],
  "9-10": ["quiz", "listen", "spelling", "matching"],
};

function getAvailableModes(ageGroup: AgeGroup, subject: Subject): string[] {
  const base = [...BASE_MODES[ageGroup]];
  // English gets spelling one level earlier (5-6세)
  if (ageGroup === "5-6" && subject === "english" && !base.includes("spelling")) {
    const listenIdx = base.indexOf("listen");
    base.splice(listenIdx + 1, 0, "spelling");
  }
  return base;
}

const MODE_META: Record<string, {
  icon: string;
  label: string;
  descs: Record<Subject, string>;
  bg: string;
  border: string;
  text: string;
}> = {
  quiz: {
    icon: "🔤",
    label: "단어 퀴즈",
    descs: { english: "영어 뜻을 맞춰요", hangul: "낱말 뜻을 맞춰요", numbers: "숫자 이름을 맞춰요" },
    bg: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
    border: "#93C5FD",
    text: "#1E40AF",
  },
  listen: {
    icon: "👂",
    label: "듣기 퀴즈",
    descs: { english: "들려주는 단어 골라요", hangul: "들려주는 낱말 골라요", numbers: "들려주는 숫자 골라요" },
    bg: "linear-gradient(135deg, #FCE7F3, #FBCFE8)",
    border: "#F9A8D4",
    text: "#9D174D",
  },
  spelling: {
    icon: "✏️",
    label: "철자 맞추기",
    descs: { english: "글자를 순서대로 눌러요", hangul: "글자를 순서대로 눌러요", numbers: "숫자를 써봐요" },
    bg: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
    border: "#6EE7B7",
    text: "#065F46",
  },
  matching: {
    icon: "🎯",
    label: "짝 맞추기",
    descs: { english: "단어와 뜻을 연결해요", hangul: "낱말과 뜻을 연결해요", numbers: "숫자와 이름을 연결해요" },
    bg: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
    border: "#FCD34D",
    text: "#92400E",
  },
};

function getMinWords(modeId: string, config: { pairs: number; choices: number }): number {
  if (modeId === "matching") return config.pairs;
  if (modeId === "quiz" || modeId === "listen") return config.choices;
  return 1;
}

interface LastScore {
  score: number;
  total: number;
  mode: string;
}

interface PracticeHubProps {
  words: PracticeWord[];
  defaultAgeGroup?: AgeGroup;
  subject?: Subject;
}

export default function PracticeHub({ words, defaultAgeGroup = "5-6", subject = "english" }: PracticeHubProps) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(defaultAgeGroup);
  const [mode, setMode] = useState<Mode>("hub");
  const [lastScore, setLastScore] = useState<LastScore | null>(null);

  const config = AGE_CONFIG[ageGroup];
  const availableModes = getAvailableModes(ageGroup, subject);
  const minRequired = Math.min(config.pairs, config.choices);

  const handleComplete = (score: number, total: number) => {
    setLastScore({ score, total, mode });
    setMode("hub");
  };

  const lang = subject === "english" ? "en" : "ko";
  if (mode === "quiz") return <WordQuizMode words={words} choicesCount={config.choices} lang={lang} onComplete={handleComplete} onBack={() => setMode("hub")} />;
  if (mode === "listen") return <ListenMode words={words} choicesCount={config.choices} lang={lang} onComplete={handleComplete} onBack={() => setMode("hub")} />;
  if (mode === "spelling") return <SpellingMode words={words} lang={lang} onComplete={handleComplete} onBack={() => setMode("hub")} />;
  if (mode === "matching") return <MatchingMode words={words} pairs={config.pairs} onComplete={handleComplete} onBack={() => setMode("hub")} />;

  return (
    <div>
      {/* 연령대 선택 */}
      <div className="mb-5">
        <p className="text-xs font-bold text-blue-400 mb-2">연습 난이도 선택</p>
        <div className="grid grid-cols-5 gap-1.5">
          {AGE_GROUPS.map((g) => (
            <button
              key={g.value}
              onClick={() => setAgeGroup(g.value)}
              className="rounded-xl py-2 text-center transition-all"
              style={ageGroup === g.value
                ? { background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "white", border: "2px solid transparent", boxShadow: "0 3px 10px rgba(99,102,241,0.3)" }
                : { background: "white", color: "#818CF8", border: "2px solid #EDE9FE" }
              }
            >
              <div className="text-base">{g.emoji}</div>
              <div className="text-xs font-bold mt-0.5">{g.label}</div>
            </button>
          ))}
        </div>
      </div>

      {lastScore && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 rounded-2xl p-3 flex items-center gap-3"
          style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}
        >
          <span className="text-2xl">
            {lastScore.score / lastScore.total >= 0.8 ? "⭐⭐⭐" : lastScore.score / lastScore.total >= 0.6 ? "⭐⭐" : "⭐"}
          </span>
          <div>
            <p className="text-sm font-black text-blue-700">
              방금 {lastScore.score}/{lastScore.total} 정답!
            </p>
            <p className="text-xs text-blue-400">계속 연습해봐요 💪</p>
          </div>
        </motion.div>
      )}

      {words.length < minRequired ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "#F8FAFF", border: "2px dashed #BFDBFE" }}
        >
          <p className="text-4xl mb-2">📚</p>
          <p className="font-bold text-blue-700 mb-1">단어가 부족해요</p>
          <p className="text-sm text-blue-400">
            "만들기"에서 학습 자료를 먼저 만들어요!
            <br />{minRequired}개 이상이면 연습을 시작할 수 있어요.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-blue-600">📦 단어 {words.length}개 준비됨</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {availableModes.map((modeId) => {
              const m = MODE_META[modeId];
              const minWords = getMinWords(modeId, config);
              const disabled = words.length < minWords;
              return (
                <motion.button
                  key={modeId}
                  onClick={() => !disabled && setMode(modeId as Mode)}
                  whileTap={{ scale: disabled ? 1 : 0.96 }}
                  className="rounded-2xl p-4 text-left transition-all"
                  style={{
                    background: m.bg,
                    border: `2px solid ${m.border}`,
                    boxShadow: `0 4px 14px ${m.border}55`,
                    opacity: disabled ? 0.45 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="text-3xl mb-2">{m.icon}</div>
                  <h3 className="font-black text-sm mb-0.5" style={{ color: m.text }}>
                    {m.label}
                  </h3>
                  <p className="text-xs opacity-70 font-medium" style={{ color: m.text }}>
                    {m.descs[subject]}
                  </p>
                  {disabled && (
                    <p className="text-xs mt-1 opacity-60" style={{ color: m.text }}>
                      단어 {minWords}개 필요
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
