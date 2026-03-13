"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const THEMES: { name: string; emoji: string; pairs: string[] }[] = [
  {
    name: "🐾 동물",
    emoji: "🐾",
    pairs: ["🦁", "🐯", "🐻", "🦊", "🐼", "🐨", "🦝", "🦄"],
  },
  {
    name: "🍎 과일",
    emoji: "🍎",
    pairs: ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🥝", "🍒"],
  },
  {
    name: "🚀 탈것",
    emoji: "🚀",
    pairs: ["🚀", "✈️", "🚂", "🚢", "🚁", "🛸", "🚗", "🛵"],
  },
  {
    name: "🌸 꽃과 자연",
    emoji: "🌸",
    pairs: ["🌸", "🌺", "🌻", "🌹", "🌷", "🍀", "🌵", "🎋"],
  },
  {
    name: "🍕 음식",
    emoji: "🍕",
    pairs: ["🍕", "🍔", "🍜", "🍣", "🍦", "🎂", "🥐", "🍩"],
  },
  {
    name: "⚽ 스포츠",
    emoji: "⚽",
    pairs: ["⚽", "🏀", "🎾", "🏐", "🏈", "🎱", "🏓", "🥊"],
  },
  {
    name: "🎵 음악",
    emoji: "🎵",
    pairs: ["🎹", "🎸", "🎺", "🥁", "🎻", "🪗", "🎷", "🪘"],
  },
  {
    name: "🌍 지구와 날씨",
    emoji: "🌍",
    pairs: ["☀️", "🌈", "⛄", "🌊", "🌪️", "⚡", "🌙", "☁️"],
  },
];

function pickRandomTheme() {
  return THEMES[Math.floor(Math.random() * THEMES.length)];
}

function playFlipSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.07);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.07);
  osc.onended = () => ctx.close();
}

function playMatchSound() {
  const ctx = new AudioContext();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.11;
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.start(t);
    osc.stop(t + 0.22);
  });
  setTimeout(() => ctx.close(), 700);
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function createCards(pairs: string[]): Card[] {
  return shuffle([...pairs, ...pairs]).map((emoji, i) => ({
    id: i, emoji, isFlipped: false, isMatched: false,
  }));
}

type Phase = "preview" | "playing";

export default function MemoryGame() {
  const [theme, setTheme] = useState(() => pickRandomTheme());
  const [cards, setCards] = useState<Card[]>(() => createCards(pickRandomTheme().pairs));
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [phase, setPhase] = useState<Phase>("preview");
  const [countdown, setCountdown] = useState(3);

  const matched = cards.filter((c) => c.isMatched).length / 2;
  const isWon = matched === theme.pairs.length;

  // 미리보기 3초 카운트다운
  useEffect(() => {
    if (phase !== "preview") return;
    setCountdown(3);
    const tick = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(tick);
          setPhase("playing");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  const handleFlip = useCallback((id: number) => {
    if (phase !== "playing" || isChecking || selected.length >= 2) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    playFlipSound();
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, isFlipped: true } : c));
    setSelected((prev) => [...prev, id]);
  }, [phase, isChecking, selected, cards]);

  useEffect(() => {
    if (selected.length !== 2) return;
    setIsChecking(true);
    setMoves((m) => m + 1);

    const [a, b] = selected.map((id) => cards.find((c) => c.id === id)!);
    if (a.emoji === b.emoji) {
      playMatchSound();
      setCards((prev) => prev.map((c) => selected.includes(c.id) ? { ...c, isMatched: true } : c));
      setSelected([]);
      setIsChecking(false);
    } else {
      setTimeout(() => {
        setCards((prev) => prev.map((c) => selected.includes(c.id) ? { ...c, isFlipped: false } : c));
        setSelected([]);
        setIsChecking(false);
      }, 900);
    }
  }, [selected]);

  function reset() {
    const newTheme = pickRandomTheme();
    setTheme(newTheme);
    setCards(createCards(newTheme.pairs));
    setSelected([]);
    setMoves(0);
    setIsChecking(false);
    setPhase("preview");
  }

  return (
    <div className="w-full">
        <PageHeader title="기억력 게임" emoji="🃏" backHref="/dashboard/games" />

        <div className="flex items-center justify-between mb-5">
          <span className="text-sm text-gray-500">짝 맞춘 카드: <b>{matched}/{theme.pairs.length}</b></span>
          <span className="text-sm text-gray-500">시도: <b>{moves}</b></span>
          <Button variant="outline" size="sm" onClick={reset}>다시 시작</Button>
        </div>

        <div className="mb-4">
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "#FFF0F8", color: "#EC4899", border: "1.5px solid #FBCFE8" }}
          >
            {theme.name} 테마
          </span>
        </div>

        {/* 미리보기 배너 */}
        {phase === "preview" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl p-3.5 text-center"
            style={{ background: "linear-gradient(135deg, #FFF0F8, #F0F4FF)", border: "2px solid #FBCFE8" }}
          >
            <p className="text-base font-black" style={{ color: "#EC4899" }}>
              👀 카드를 외우세요!
            </p>
            <p className="text-sm font-bold mt-0.5" style={{ color: "#9CA3AF" }}>
              <span className="text-2xl font-black" style={{ color: "#4F46E5" }}>{countdown}</span>초 후 시작
            </p>
          </motion.div>
        )}

        {isWon && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="mb-5 rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-center">
            <p className="text-xl font-bold text-yellow-700">🎉 완성! {moves}번 만에 성공했어요!</p>
            <Button className="mt-3" onClick={reset}>다시 하기</Button>
          </motion.div>
        )}

        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => {
            const revealed = phase === "preview" || card.isFlipped || card.isMatched;
            return (
              <motion.button
                key={card.id}
                onClick={() => handleFlip(card.id)}
                whileTap={phase === "playing" ? { scale: 0.92 } : {}}
                className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 border-2 ${
                  card.isMatched
                    ? "bg-green-50 border-green-200"
                    : phase === "preview"
                    ? "bg-purple-50 border-purple-200"
                    : card.isFlipped
                    ? "bg-white border-pink-200 shadow-notion"
                    : "bg-pink-50 border-pink-200 hover:bg-pink-100 cursor-pointer"
                }`}
                style={{ cursor: phase === "preview" ? "default" : undefined }}
              >
                <span style={{ fontSize: revealed ? "clamp(2.4rem,12vw,5.5rem)" : "clamp(1.2rem,5vw,2.2rem)", lineHeight: 1 }}>
                  {revealed ? card.emoji : "?"}
                </span>
              </motion.button>
            );
          })}
        </div>
    </div>
  );
}
