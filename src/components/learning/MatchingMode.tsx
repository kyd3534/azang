"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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

interface Card {
  id: string;        // unique card id
  pairId: string;    // shared by English + Korean card of same word
  type: "en" | "ko";
  display: string;
  emoji?: string;
  matched: boolean;
}

interface Props {
  words: PracticeWord[];
  pairs?: number;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
}

export default function MatchingMode({ words, pairs: PAIRS = 4, onComplete, onBack }: Props) {
  const pool = useMemo(() => shuffle(words).slice(0, PAIRS), [words, PAIRS]);

  const initCards = (): Card[] => {
    const enCards: Card[] = pool.map((w) => ({
      id: `en-${w.word}`,
      pairId: w.word,
      type: "en",
      display: w.word,
      emoji: w.emoji,
      matched: false,
    }));
    const koCards: Card[] = pool.map((w) => ({
      id: `ko-${w.word}`,
      pairId: w.word,
      type: "ko",
      display: w.meaning,
      matched: false,
    }));
    return shuffle([...enCards, ...koCards]);
  };

  const [cards, setCards] = useState<Card[]>(initCards);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  function handleTap(id: string) {
    if (wrong.length > 0) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched) return;

    if (selected === null) {
      setSelected(id);
      return;
    }

    if (selected === id) {
      setSelected(null);
      return;
    }

    const selCard = cards.find((c) => c.id === selected)!;

    if (selCard.pairId === card.pairId && selCard.type !== card.type) {
      // Correct match
      playTone([523, 659, 784]);
      const newCards = cards.map((c) =>
        c.id === id || c.id === selected ? { ...c, matched: true } : c
      );
      setCards(newCards);
      setSelected(null);
      setScore((s) => s + 1);
      if (newCards.every((c) => c.matched)) {
        setTimeout(() => setDone(true), 500);
      }
    } else {
      // Wrong
      playTone([200], "sawtooth");
      setWrong([selected, id]);
      setTimeout(() => {
        setWrong([]);
        setSelected(null);
      }, 700);
    }
  }

  function reset() {
    setCards(initCards());
    setSelected(null);
    setWrong([]);
    setScore(0);
    setDone(false);
  }

  if (done) {
    const stars = score >= PAIRS ? 3 : score >= PAIRS * 0.6 ? 2 : 1;
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-blue-500">← 돌아가기</Button>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "2px solid #FCD34D" }}
        >
          <div className="text-5xl mb-3">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
          <h2 className="text-2xl font-black text-yellow-800 mb-2">짝 맞추기 완료!</h2>
          <p className="text-sm text-yellow-700 mb-5">{PAIRS}쌍 모두 연결했어요! 🎉</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={reset}
              style={{ background: "linear-gradient(90deg,#F59E0B,#D97706)", color: "white" }}
            >
              다시 하기
            </Button>
            <Button variant="outline" onClick={() => onComplete(PAIRS, PAIRS)}>나가기</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const matched = cards.filter((c) => c.matched).length / 2;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 text-blue-500">← 돌아가기</Button>

      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          짝 맞춘 카드: <b className="text-yellow-600">{matched}/{PAIRS}</b>
        </p>
        <Button variant="outline" size="sm" onClick={reset}>다시 섞기</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => {
          const isSelected = selected === card.id;
          const isWrong = wrong.includes(card.id);

          return (
            <motion.button
              key={card.id}
              onClick={() => handleTap(card.id)}
              animate={
                isWrong ? { x: [-6, 6, -5, 5, 0] } :
                card.matched ? { scale: [1, 1.05, 1] } : {}
              }
              transition={{ duration: 0.35 }}
              className="rounded-2xl p-4 min-h-[80px] flex flex-col items-center justify-center gap-1 transition-all duration-150"
              style={{
                background: card.matched ? "#DCFCE7"
                  : isWrong ? "#FEE2E2"
                  : isSelected ? "#DBEAFE"
                  : card.type === "en" ? "#F8FAFF" : "#FFFBEB",
                border: `2.5px solid ${
                  card.matched ? "#86EFAC"
                  : isWrong ? "#FCA5A5"
                  : isSelected ? "#60A5FA"
                  : card.type === "en" ? "#BFDBFE" : "#FDE68A"
                }`,
                boxShadow: isSelected ? "0 0 0 3px rgba(96,165,250,0.3)" : "none",
                opacity: card.matched ? 0.6 : 1,
              }}
              disabled={card.matched}
            >
              {card.emoji && <span className="text-2xl">{card.emoji}</span>}
              <span
                className="font-black text-sm text-center break-words"
                style={{
                  color: card.matched ? "#166534"
                    : isWrong ? "#991B1B"
                    : card.type === "en" ? "#1E40AF" : "#92400E",
                }}
              >
                {card.display}
              </span>
              <span className="text-xs opacity-50" style={{ color: card.type === "en" ? "#60A5FA" : "#F59E0B" }}>
                {card.type === "en" ? "영어" : "뜻"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
