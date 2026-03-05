"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

const COLORS = [
  { name: "빨강", hex: "#EF4444" },
  { name: "파랑", hex: "#3B82F6" },
  { name: "노랑", hex: "#EAB308" },
  { name: "초록", hex: "#22C55E" },
  { name: "분홍", hex: "#EC4899" },
  { name: "보라", hex: "#A855F7" },
  { name: "주황", hex: "#F97316" },
  { name: "하늘", hex: "#06B6D4" },
];

const SHAPES = [
  { name: "원" },
  { name: "삼각형" },
  { name: "사각형" },
  { name: "별" },
  { name: "하트" },
];

interface Question {
  type: "color" | "shape";
  displayColor: string;
  displayShape: string;
  answer: string;
  choices: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playSound(freq: number, type: OscillatorType, duration: number) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch { /* ignore */ }
}

function playCorrect() {
  playSound(523, "sine", 0.15);
  setTimeout(() => playSound(659, "sine", 0.15), 150);
  setTimeout(() => playSound(784, "sine", 0.25), 300);
}

function playWrong() {
  playSound(300, "triangle", 0.15);
  setTimeout(() => playSound(250, "triangle", 0.2), 150);
}

function generateQuestions(): Question[] {
  const qs: Question[] = [];
  const sc = shuffle(COLORS);
  const ss = shuffle(SHAPES);

  for (let i = 0; i < 5; i++) {
    const correct = sc[i];
    const wrong = shuffle(COLORS.filter(c => c.name !== correct.name)).slice(0, 3);
    qs.push({
      type: "color",
      displayColor: correct.hex,
      displayShape: "원",
      answer: correct.name,
      choices: shuffle([correct.name, ...wrong.map(c => c.name)]),
    });
  }

  for (let i = 0; i < 5; i++) {
    const correct = ss[i];
    const wrong = shuffle(SHAPES.filter(s => s.name !== correct.name)).slice(0, 3);
    qs.push({
      type: "shape",
      displayColor: "#60A5FA",
      displayShape: correct.name,
      answer: correct.name,
      choices: shuffle([correct.name, ...wrong.map(s => s.name)]),
    });
  }

  return shuffle(qs);
}

function ShapeSvg({ shape, color, size = 120 }: { shape: string; color: string; size?: number }) {
  const s = size;
  const cx = s / 2, cy = s / 2;
  const r = s * 0.38;

  if (shape === "원") {
    return <svg width={s} height={s}><circle cx={cx} cy={cy} r={r} fill={color} /></svg>;
  }
  if (shape === "사각형") {
    return (
      <svg width={s} height={s}>
        <rect x={s * 0.12} y={s * 0.12} width={s * 0.76} height={s * 0.76} fill={color} rx={6} />
      </svg>
    );
  }
  if (shape === "삼각형") {
    const pts = `${cx},${s * 0.1} ${s * 0.9},${s * 0.9} ${s * 0.1},${s * 0.9}`;
    return <svg width={s} height={s}><polygon points={pts} fill={color} /></svg>;
  }
  if (shape === "별") {
    const outer = r, inner = r * 0.42;
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? outer : inner;
      return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    }).join(" ");
    return <svg width={s} height={s}><polygon points={pts} fill={color} /></svg>;
  }
  if (shape === "하트") {
    const d = Array.from({ length: 40 }, (_, i) => {
      const t = (i / 40) * Math.PI * 2;
      const x = cx + 16 * Math.pow(Math.sin(t), 3) * (r / 16);
      const y = cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * (r / 16);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ") + "Z";
    return <svg width={s} height={s}><path d={d} fill={color} /></svg>;
  }
  return <svg width={s} height={s}><circle cx={cx} cy={cy} r={r} fill={color} /></svg>;
}

export default function ColorShapeGame() {
  const [questions, setQuestions] = useState<Question[]>(generateQuestions);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [done, setDone] = useState(false);

  const q = questions[current];

  function showParticles() {
    const colors = ["#60A5FA", "#F472B6", "#34D399", "#FBBF24", "#A78BFA"];
    setParticles(
      Array.from({ length: 16 }, (_, i) => ({
        id: Date.now() + i,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 80,
        color: colors[i % colors.length],
      }))
    );
    setTimeout(() => setParticles([]), 800);
  }

  // 새 문제마다 질문 자동 읽기
  useEffect(() => {
    if (done) return;
    const q = questions[current];
    const msg = q.type === "color" ? "무슨 색이에요?" : "무슨 모양이에요?";
    const timer = setTimeout(() => speak(msg, { lang: "ko" }), 300);
    return () => clearTimeout(timer);
  }, [current, done]);

  function handleAnswer(choice: string) {
    if (answered !== null) return;
    setAnswered(choice);

    // 선택한 답 먼저 읽기
    speak(choice, { lang: "ko" });

    if (choice === q.answer) {
      setScore(s => s + 1);
      playCorrect();
      showParticles();
      const msgs = ["맞아요!", "훌륭해요!", "대단해요!", "완벽해요!"];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      setTimeout(() => speak(`${msg} ${q.answer}이에요!`, { lang: "ko" }), 500);
    } else {
      playWrong();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => speak(`아쉬워요! 정답은 ${q.answer}이에요`, { lang: "ko" }), 500);
    }
    setTimeout(() => {
      setAnswered(null);
      if (current + 1 >= questions.length) {
        setDone(true);
      } else {
        setCurrent(c => c + 1);
      }
    }, 1200);
  }

  function restart() {
    setQuestions(generateQuestions());
    setCurrent(0);
    setScore(0);
    setAnswered(null);
    setDone(false);
    setParticles([]);
  }

  if (done) {
    const stars = score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
    const resultMsg =
      stars === 3 ? "완벽해요! 모두 맞혔어요!" :
      stars === 2 ? "잘 했어요! 조금만 더 연습해요!" :
      stars === 1 ? "조금 더 연습해봐요!" : "다시 도전해봐요!";
    return (
      <div>
        <PageHeader title="색깔/모양 맞추기" emoji="🎨" backHref="/dashboard/games" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onAnimationComplete={() => {
            speak(`${score}개 맞혔어요! ${resultMsg}`, { lang: "ko" });
          }}
          className="text-center py-8 px-4 rounded-3xl max-w-sm"
          style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "2px solid #93C5FD" }}
        >
          <div className="text-5xl mb-3">{"⭐".repeat(stars)}{"☆".repeat(3 - stars)}</div>
          <h2 className="text-2xl font-black text-blue-700 mb-2">결과 발표!</h2>
          <p className="text-lg font-bold text-blue-600 mb-1">{score} / {questions.length} 정답!</p>
          <p className="text-sm text-blue-400 mb-5">{resultMsg}</p>
          <Button onClick={restart} style={{ background: "linear-gradient(90deg,#3B82F6,#6366F1)", color: "white" }}>
            다시 하기
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <PageHeader title="색깔/모양 맞추기" emoji="🎨" backHref="/dashboard/games" />

      <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
        <span>문제 <b className="text-blue-600">{current + 1}/{questions.length}</b></span>
        <span>정답 <b className="text-blue-600">{score}개</b></span>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-100 rounded-full mb-5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #3B82F6, #6366F1)" }}
          animate={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          className="relative"
        >
          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" style={{ zIndex: 10 }}>
            <AnimatePresence>
              {particles.map(p => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 1, scale: 1.2, x: `${p.x}%`, y: `${p.y}%` }}
                  animate={{ opacity: 0, scale: 0.3, y: `${p.y - 35}%` }}
                  transition={{ duration: 0.7 }}
                  style={{
                    position: "absolute",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: p.color,
                  }}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Question card */}
          <motion.div
            animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="rounded-2xl p-5 mb-4 flex flex-col items-center"
            style={{ background: "#F8FAFF", border: "2px solid #BFDBFE" }}
          >
            <p className="text-sm font-bold text-blue-400 mb-3">
              {q.type === "color" ? "무슨 색이에요? 🎨" : "무슨 모양이에요? 🔵"}
            </p>
            <ShapeSvg shape={q.displayShape} color={q.displayColor} size={120} />
          </motion.div>

          {/* Choices */}
          <div className="grid grid-cols-2 gap-3">
            {q.choices.map(choice => {
              const isAnswered = answered !== null;
              const isCorrect = choice === q.answer;
              const isSelected = choice === answered;
              let bg = "white", border = "#BFDBFE", textColor = "#1E40AF";
              if (isAnswered) {
                if (isCorrect) { bg = "#DCFCE7"; border = "#86EFAC"; textColor = "#166534"; }
                else if (isSelected) { bg = "#FEE2E2"; border = "#FCA5A5"; textColor = "#991B1B"; }
              }
              return (
                <button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={isAnswered}
                  className="rounded-xl py-4 font-black text-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ background: bg, border: `2px solid ${border}`, color: textColor }}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
