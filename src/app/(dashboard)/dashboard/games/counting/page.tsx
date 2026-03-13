"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const ITEMS = ["🍎", "🌟", "🐱", "🎈", "🦋", "🍭", "🐸", "🚗", "🍊", "⭐", "🐶", "🌸", "🍇", "🚂", "🦊"];

const LEVELS = [
  { label: "1단계", emoji: "🐣", min: 1, max: 10, step: 1, choiceRange: 3, desc: "1~10" },
  { label: "2단계", emoji: "🐥", min: 1, max: 20, step: 1, choiceRange: 5, desc: "1~20" },
  { label: "3단계", emoji: "🐰", min: 1, max: 50, step: 1, choiceRange: 12, desc: "1~50" },
  { label: "4단계", emoji: "🦁", min: 5, max: 100, step: 5, choiceRange: 20, desc: "5~100" },
];

const TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];
const ONES = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];

function toKorean(n: number): string {
  if (n === 100) return "백";
  const t = Math.floor(n / 10), o = n % 10;
  return TENS[t] + ONES[o];
}

function generateQuestion(levelIdx: number) {
  const lv = LEVELS[levelIdx];
  const steps = Math.floor((lv.max - lv.min) / lv.step) + 1;
  const count = lv.min + Math.floor(Math.random() * steps) * lv.step;
  const emoji = ITEMS[Math.floor(Math.random() * ITEMS.length)];

  const choiceSet = new Set<number>([count]);
  let attempts = 0;
  while (choiceSet.size < 4 && attempts < 200) {
    attempts++;
    const offset = (Math.floor(Math.random() * lv.choiceRange * 2 + 1) - lv.choiceRange);
    let c = count + offset;
    c = Math.round(c / lv.step) * lv.step;
    c = Math.max(lv.min, Math.min(lv.max, c));
    if (c !== count) choiceSet.add(c);
  }
  // Fallback if not enough unique choices
  let fallback = lv.min;
  while (choiceSet.size < 4) {
    if (!choiceSet.has(fallback)) choiceSet.add(fallback);
    fallback += lv.step;
  }

  return { count, emoji, choices: [...choiceSet].sort(() => Math.random() - 0.5) };
}

const CORRECT = ["잘했어요!", "훌륭해요!", "맞아요, 대단해요!", "완벽해요!", "최고예요!"];
const WRONG = ["다시 해봐요!", "조금만 더 생각해봐요!", "괜찮아요, 한번 더!", "아쉬워요, 다시 세어봐요!"];

function speakKo(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR"; utter.rate = 0.88; utter.pitch = 1.2;
  const doSpeak = () => {
    const ko = synth.getVoices().find(v => v.lang.startsWith("ko")) ?? null;
    if (ko) utter.voice = ko;
    synth.speak(utter);
  };
  synth.getVoices().length > 0 ? doSpeak() : synth.addEventListener("voiceschanged", doSpeak, { once: true });
}

// Visual display of count as groups of 10 + remainder
function CountDisplay({ count, emoji }: { count: number; emoji: string }) {
  if (count <= 20) {
    return (
      <div className="flex flex-wrap justify-center gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className="text-2xl">{emoji}</span>
        ))}
      </div>
    );
  }

  const tens = Math.floor(count / 10);
  const ones = count % 10;

  return (
    <div className="space-y-3">
      {/* Groups of 10 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: tens }).map((_, gi) => (
          <div key={gi} className="rounded-xl p-1.5 flex flex-wrap gap-0.5 justify-center"
            style={{ background: "rgba(99,102,241,0.07)", border: "1.5px solid rgba(99,102,241,0.2)", width: 68 }}>
            {Array.from({ length: 10 }).map((_, j) => (
              <span key={j} className="text-sm leading-none">{emoji}</span>
            ))}
          </div>
        ))}
      </div>
      {/* Remainder */}
      {ones > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: ones }).map((_, i) => (
            <span key={i} className="text-2xl">{emoji}</span>
          ))}
        </div>
      )}
      {/* Label */}
      <p className="text-center text-xs text-indigo-400 font-bold">
        {tens > 0 && `${tens}묶음(×10)`}{ones > 0 && ` + ${ones}개`}
      </p>
    </div>
  );
}

export default function CountingGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [question, setQuestion] = useState(() => generateQuestion(0));
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [comment, setComment] = useState<{ text: string; correct: boolean } | null>(null);

  const nextQuestion = useCallback((lvIdx = levelIdx) => {
    setAnswered(null);
    setComment(null);
    setQuestion(generateQuestion(lvIdx));
  }, [levelIdx]);

  const handleChoiceClick = useCallback((choice: number) => {
    if (answered !== null) return;
    setAnswered(choice);
    setTotal(t => t + 1);
    const isCorrect = choice === question.count;
    if (isCorrect) {
      setScore(s => s + 1);
      const msg = CORRECT[Math.floor(Math.random() * CORRECT.length)];
      setComment({ text: msg, correct: true });
    } else {
      const msg = WRONG[Math.floor(Math.random() * WRONG.length)];
      setComment({ text: msg, correct: false });
    }
    setTimeout(() => nextQuestion(), 1800);
  }, [answered, question.count, nextQuestion]);

  const handleChangeLevel = (idx: number) => {
    setLevelIdx(idx);
    setScore(0); setTotal(0);
    setAnswered(null); setComment(null);
    setQuestion(generateQuestion(idx));
  };

  return (
    <div className="w-full">
      <PageHeader title="숫자 세기" emoji="🔢" backHref="/dashboard/games" />

      {/* Level selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {LEVELS.map((lv, i) => (
          <button key={lv.label} onClick={() => handleChangeLevel(i)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all flex items-center gap-1 ${
              levelIdx === i ? "bg-indigo-500 text-white shadow" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}>
            {lv.emoji} {lv.label} <span className="text-xs opacity-70">({lv.desc})</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-500">점수: <b>{score}/{total}</b></span>
        <Button variant="outline" size="sm" onClick={() => handleChangeLevel(levelIdx)}>초기화</Button>
      </div>

      <div className="space-y-5">
        <AnimatePresence mode="wait">
          <motion.div key={`${question.emoji}-${question.count}-${levelIdx}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-white shadow-notion p-5 select-none"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-400">몇 개인가요?</p>
              <button
                onClick={() => speakKo(`${toKorean(question.count)}! ${question.count}개!`)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                style={{ background: "#EEF2FF", color: "#4F46E5", border: "1.5px solid #C7D2FE" }}
              >
                🔊 듣기
              </button>
            </div>
            <CountDisplay count={question.count} emoji={question.emoji} />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {comment && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85 }}
              className="rounded-xl py-3 px-4 text-center font-black text-base"
              style={comment.correct
                ? { background: "#F0FDF4", border: "2px solid #86EFAC", color: "#15803D" }
                : { background: "#FFF1F2", border: "2px solid #FECDD3", color: "#BE123C" }
              }>
              {comment.correct ? "🌟 " : "💪 "}{comment.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          {question.choices.map((choice) => {
            const isCorrect = choice === question.count;
            const isSelected = answered === choice;
            let cls = "rounded-xl py-4 text-2xl font-bold border-2 transition-all duration-200 ";
            if (answered !== null) {
              if (isCorrect) cls += "bg-green-50 border-green-400 text-green-700";
              else if (isSelected) cls += "bg-red-50 border-red-400 text-red-700";
              else cls += "bg-gray-50 border-gray-200 text-gray-300";
            } else {
              cls += "bg-white border-gray-200 hover:border-indigo-400 hover:shadow-notion cursor-pointer";
            }
            return (
              <button key={choice} onClick={() => handleChoiceClick(choice)} className={cls}>
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
