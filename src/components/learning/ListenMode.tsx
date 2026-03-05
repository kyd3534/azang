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

interface Question {
  word: PracticeWord;
  choices: PracticeWord[];
}

interface Props {
  words: PracticeWord[];
  choicesCount?: number;
  lang?: "ko" | "en";
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

export default function ListenMode({ words, choicesCount = 4, lang = "en", onComplete, onBack }: Props) {
  const questions = useMemo<Question[]>(() => {
    const pool = shuffle(words).slice(0, 10);
    return pool.map((w) => {
      const wrong = shuffle(words.filter((x) => x.word !== w.word)).slice(0, choicesCount - 1);
      return { word: w, choices: shuffle([w, ...wrong]) };
    });
  }, [words, choicesCount]);

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const { tts } = useVoice();

  const q = questions[current];

  function playWord() {
    if (playing) return;
    setPlaying(true);
    setHasPlayed(true);
    tts(q.word.word, {
      lang,
      rate: 0.75,
      onEnd: () => setPlaying(false),
    });
  }

  function handleAnswer(word: string) {
    if (answered !== null) return;
    setAnswered(word);
    if (word === q.word.word) {
      setScore((s) => s + 1);
      playTone([523, 659, 784]);
    } else {
      playTone([200], "sawtooth");
    }
    setTimeout(() => {
      if (current + 1 >= questions.length) setDone(true);
      else { setCurrent((c) => c + 1); setAnswered(null); setHasPlayed(false); }
    }, 1000);
  }

  if (done) {
    const stars = score / questions.length >= 0.9 ? 3 : score / questions.length >= 0.6 ? 2 : 1;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-blue-500">← 돌아가기</Button>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, #FCE7F3, #FBCFE8)", border: "2px solid #F9A8D4" }}
        >
          <div className="text-5xl mb-3">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
          <h2 className="text-2xl font-black text-pink-800 mb-2">듣기 퀴즈 완료!</h2>
          <p className="text-lg font-bold text-pink-700 mb-5">{score}/{questions.length} 정답</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => { setCurrent(0); setScore(0); setAnswered(null); setDone(false); setHasPlayed(false); }}
              style={{ background: "linear-gradient(90deg,#EC4899,#BE185D)", color: "white" }}
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
            style={{ background: "linear-gradient(90deg, #EC4899, #BE185D)" }}
            animate={{ width: `${(current / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-pink-600 whitespace-nowrap">{current + 1}/{questions.length}</span>
        <span className="text-sm font-bold text-yellow-500">⭐ {score}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          <div className="flex flex-col items-center mb-6">
            <p className="text-sm font-bold text-pink-400 mb-4">소리를 듣고 단어를 골라요 👂</p>
            <motion.button
              onClick={playWord}
              whileTap={{ scale: 0.9 }}
              animate={playing ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.6, repeat: playing ? Infinity : 0 }}
              className="w-28 h-28 rounded-full flex flex-col items-center justify-center font-bold shadow-lg"
              style={{
                background: playing
                  ? "linear-gradient(135deg,#F9A8D4,#EC4899)"
                  : "linear-gradient(135deg,#FCE7F3,#FBCFE8)",
                border: "3px solid #F9A8D4",
                boxShadow: "0 6px 24px rgba(249,168,212,0.45)",
                color: "#9D174D",
              }}
            >
              <span className="text-4xl">{playing ? "🔊" : "🔉"}</span>
              <span className="text-xs mt-1 font-bold">
                {playing ? "듣는 중..." : hasPlayed ? "다시 듣기" : "눌러요!"}
              </span>
            </motion.button>
          </div>

          {/* 4-choice grid with emoji cards */}
          <div className="grid grid-cols-2 gap-3">
            {q.choices.map((choice) => {
              const isAnswered = answered !== null;
              const isCorrect = choice.word === q.word.word;
              const isSelected = choice.word === answered;
              let bg = "white", border = "#FBCFE8", color = "#9D174D";
              if (isAnswered) {
                if (isCorrect) { bg = "#DCFCE7"; border = "#86EFAC"; color = "#166534"; }
                else if (isSelected) { bg = "#FEE2E2"; border = "#FCA5A5"; color = "#991B1B"; }
              }
              return (
                <motion.button
                  key={choice.word}
                  onClick={() => handleAnswer(choice.word)}
                  disabled={isAnswered}
                  whileTap={{ scale: isAnswered ? 1 : 0.95 }}
                  className="rounded-2xl p-4 flex flex-col items-center gap-1 transition-all"
                  style={{ background: bg, border: `2px solid ${border}`, color }}
                >
                  <span className="text-4xl">{choice.emoji}</span>
                  <span className="font-black text-sm">{choice.word}</span>
                  <span className="text-xs opacity-70">{choice.meaning}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
