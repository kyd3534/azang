"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/lib/voice-context";
import type { PracticeWord } from "./PracticeHub";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playTone(freqs: number[], type: OscillatorType = "sine") {
  try {
    const ctx = new AudioContext();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = type; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.15;
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(t); o.stop(t + 0.2);
    });
  } catch { /* ignore */ }
}

interface Props {
  words: PracticeWord[];
  choicesCount?: number;
  lang?: "ko" | "en";
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

interface Question {
  word: PracticeWord;
  choices: string[];
}

export default function WordQuizMode({ words, choicesCount = 4, lang = "en", onComplete, onBack }: Props) {
  const questions = useMemo<Question[]>(() => {
    const pool = shuffle(words).slice(0, 10);
    return pool.map((w) => {
      const wrong = shuffle(words.filter((x) => x.meaning !== w.meaning)).slice(0, choicesCount - 1);
      return { word: w, choices: shuffle([w.meaning, ...wrong.map((x) => x.meaning)]) };
    });
  }, [words, choicesCount]);

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = questions[current];
  const { tts } = useVoice();

  function playWord(word: string) {
    tts(word, { lang });
  }

  function handleAnswer(choice: string) {
    if (answered !== null) return;
    setAnswered(choice);
    if (choice === q.word.meaning) {
      setScore((s) => s + 1);
      playTone([523, 659, 784]);
    } else {
      playTone([200], "sawtooth");
    }
    setTimeout(() => {
      if (current + 1 >= questions.length) setDone(true);
      else { setCurrent((c) => c + 1); setAnswered(null); }
    }, 1000);
  }

  if (done) {
    const pct = score / questions.length;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-blue-500">← 돌아가기</Button>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "2px solid #93C5FD" }}
        >
          <div className="text-5xl mb-3">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
          <h2 className="text-2xl font-black text-blue-700 mb-1">단어 퀴즈 완료!</h2>
          <p className="text-lg font-bold text-blue-600">{score} / {questions.length} 정답</p>
          <p className="text-sm text-blue-400 mb-5">
            {stars === 3 ? "완벽해요! 🎉" : stars === 2 ? "잘 했어요! 👍" : "다시 도전해봐요! 💪"}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => { setCurrent(0); setScore(0); setAnswered(null); setDone(false); }}
              style={{ background: "linear-gradient(90deg,#3B82F6,#6366F1)", color: "white" }}
            >
              다시 하기
            </Button>
            <Button variant="outline" onClick={() => onComplete(score, questions.length)}>나가기</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 text-blue-500">← 돌아가기</Button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #3B82F6, #6366F1)" }}
            animate={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-blue-600 whitespace-nowrap">{current + 1}/{questions.length}</span>
        <span className="text-sm font-bold text-yellow-500">⭐ {score}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          <div
            className="rounded-2xl p-6 mb-5 text-center cursor-pointer"
            style={{ background: "#F8FAFF", border: "2px solid #BFDBFE" }}
            onClick={() => playWord(q.word.word)}
          >
            <div className="text-6xl mb-3">{q.word.emoji}</div>
            <h2 className="text-3xl font-black text-blue-900">{q.word.word}</h2>
            {q.word.pronunciation && (
              <p className="text-sm text-blue-400 mt-1">[{q.word.pronunciation}]</p>
            )}
            <p className="text-xs text-blue-300 mt-2">🔊 탭하면 발음을 들을 수 있어요</p>
          </div>

          <p className="text-sm font-bold text-blue-400 mb-3 text-center">무슨 뜻이에요?</p>

          <div className="grid grid-cols-2 gap-3">
            {q.choices.map((choice) => {
              const isAnswered = answered !== null;
              const isCorrect = choice === q.word.meaning;
              const isSelected = choice === answered;
              let bg = "white", border = "#BFDBFE", color = "#1E40AF";
              if (isAnswered) {
                if (isCorrect) { bg = "#DCFCE7"; border = "#86EFAC"; color = "#166534"; }
                else if (isSelected) { bg = "#FEE2E2"; border = "#FCA5A5"; color = "#991B1B"; }
              }
              return (
                <motion.button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={isAnswered}
                  whileTap={{ scale: isAnswered ? 1 : 0.95 }}
                  className="rounded-xl py-4 font-black text-base transition-all"
                  style={{ background: bg, border: `2px solid ${border}`, color }}
                >
                  {isAnswered && isCorrect ? "✅ " : ""}{choice}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
