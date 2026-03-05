"use client";

import { useState, useMemo, useEffect } from "react";
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

function scrambleWord(word: string): { letter: string; id: number }[] {
  const letters = word.toUpperCase().split("").map((l, i) => ({ letter: l, id: i }));
  // Ensure scrambled (not same as original for short words)
  let result = shuffle(letters);
  let tries = 0;
  while (result.map((l) => l.letter).join("") === word.toUpperCase() && tries < 5) {
    result = shuffle(letters);
    tries++;
  }
  return result;
}

interface Props {
  words: PracticeWord[];
  lang?: "ko" | "en";
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

export default function SpellingMode({ words, lang = "en", onComplete, onBack }: Props) {
  const pool = useMemo(() => shuffle(words).slice(0, 8), [words]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const w = pool[current];
  const [letters, setLetters] = useState<{ letter: string; id: number }[]>(() => scrambleWord(w.word));
  const [typed, setTyped] = useState<{ letter: string; id: number }[]>([]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const { tts } = useVoice();

  useEffect(() => {
    const newWord = pool[current];
    setLetters(scrambleWord(newWord.word));
    setTyped([]);
    setStatus("idle");
  }, [current, pool]);

  function tapLetter(item: { letter: string; id: number }) {
    if (status !== "idle") return;
    const newTyped = [...typed, item];
    setTyped(newTyped);
    setLetters((prev) => prev.filter((l) => l.id !== item.id));

    if (newTyped.length === w.word.length) {
      const spelled = newTyped.map((l) => l.letter).join("").toUpperCase();
      if (spelled === w.word.toUpperCase()) {
        setStatus("correct");
        tts(w.word, { lang });
        setTimeout(() => {
          const nextIdx = current + 1;
          if (nextIdx >= pool.length) {
            setScore((s) => s + 1);
            setDone(true);
          } else {
            setScore((s) => s + 1);
            setCurrent(nextIdx);
          }
        }, 1300);
      } else {
        setStatus("wrong");
        setTimeout(() => {
          setLetters(scrambleWord(w.word));
          setTyped([]);
          setStatus("idle");
        }, 900);
      }
    }
  }

  function removeLast() {
    if (typed.length === 0 || status !== "idle") return;
    const last = typed[typed.length - 1];
    setTyped((prev) => prev.slice(0, -1));
    setLetters((prev) => [...prev, last]);
  }

  if (done) {
    const stars = score >= pool.length ? 3 : score >= pool.length * 0.6 ? 2 : 1;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-blue-500">← 돌아가기</Button>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)", border: "2px solid #6EE7B7" }}
        >
          <div className="text-5xl mb-3">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
          <h2 className="text-2xl font-black text-green-800 mb-2">철자 완료!</h2>
          <p className="text-lg font-bold text-green-700 mb-5">{score}/{pool.length} 성공</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => { setCurrent(0); setScore(0); setDone(false); }}
              style={{ background: "linear-gradient(90deg, #10B981, #059669)", color: "white" }}
            >
              다시 하기
            </Button>
            <Button variant="outline" onClick={() => onComplete(score, pool.length)}>나가기</Button>
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
            style={{ background: "linear-gradient(90deg, #10B981, #059669)" }}
            animate={{ width: `${(current / pool.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-bold text-green-600 whitespace-nowrap">{current + 1}/{pool.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div
            className="rounded-2xl p-5 mb-5 text-center"
            style={{ background: "#F0FDF4", border: "2px solid #BBF7D0" }}
          >
            <div className="text-5xl mb-2">{w.emoji}</div>
            <p className="text-xl font-black text-green-800">{w.meaning}</p>
            <p className="text-xs text-green-400 mt-1">{lang === "ko" ? "어떻게 쓸까요?" : "영어로 어떻게 쓸까요?"}</p>
          </div>

          {/* Answer boxes */}
          <div className="flex gap-2 justify-center mb-5 flex-wrap">
            {Array.from({ length: w.word.length }, (_, i) => (
              <motion.div
                key={i}
                animate={
                  status === "correct" ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } :
                  status === "wrong" ? { x: [-6, 6, -5, 5, 0] } : {}
                }
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg"
                style={{
                  border: `2.5px solid ${status === "correct" ? "#86EFAC" : status === "wrong" ? "#FCA5A5" : "#6EE7B7"}`,
                  background: typed[i]
                    ? status === "correct" ? "#DCFCE7" : status === "wrong" ? "#FEE2E2" : "#F0FDF4"
                    : "white",
                  color: status === "correct" ? "#166534" : status === "wrong" ? "#991B1B" : "#065F46",
                }}
              >
                {typed[i]?.letter ?? ""}
              </motion.div>
            ))}
          </div>

          {/* Scrambled letter buttons */}
          <div className="flex gap-2 justify-center flex-wrap mb-4 min-h-[48px]">
            {letters.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => tapLetter(item)}
                whileTap={{ scale: 0.88 }}
                disabled={status !== "idle"}
                className="w-11 h-11 rounded-xl font-black text-lg transition-all"
                style={{
                  background: "#D1FAE5",
                  border: "2px solid #6EE7B7",
                  color: "#065F46",
                }}
              >
                {item.letter}
              </motion.button>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={removeLast}
              disabled={typed.length === 0 || status !== "idle"}
            >
              ← 지우기
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
