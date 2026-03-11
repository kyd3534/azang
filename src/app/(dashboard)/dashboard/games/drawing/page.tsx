"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const SIZE = 280;
const BRUSH = 20;
const RADIUS = 22;
const THRESHOLD = 0.70;

type Waypoint = [number, number];

interface Shape {
  name: string;
  emoji: string;
  waypoints: Waypoint[];
}

const SHAPES: Shape[] = [
  {
    name: "동그라미",
    emoji: "⭕",
    waypoints: Array.from({ length: 36 }, (_, i): Waypoint => {
      const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
      return [140 + 90 * Math.cos(a), 140 + 90 * Math.sin(a)];
    }),
  },
  {
    name: "네모",
    emoji: "⬛",
    waypoints: [
      ...Array.from({ length: 9 }, (_, i): Waypoint => [55 + 170 * (i / 8), 55]),
      ...Array.from({ length: 9 }, (_, i): Waypoint => [225, 55 + 170 * (i / 8)]),
      ...Array.from({ length: 9 }, (_, i): Waypoint => [225 - 170 * (i / 8), 225]),
      ...Array.from({ length: 9 }, (_, i): Waypoint => [55, 225 - 170 * (i / 8)]),
    ],
  },
  {
    name: "세모",
    emoji: "🔺",
    waypoints: [
      ...Array.from({ length: 12 }, (_, i): Waypoint => [140 + (250 - 140) * (i / 11), 30 + (220 - 30) * (i / 11)]),
      ...Array.from({ length: 12 }, (_, i): Waypoint => [250 + (30 - 250) * (i / 11), 220]),
      ...Array.from({ length: 12 }, (_, i): Waypoint => [30 + (140 - 30) * (i / 11), 220 + (30 - 220) * (i / 11)]),
    ],
  },
  {
    name: "별",
    emoji: "⭐",
    waypoints: (() => {
      const pts: Waypoint[] = [];
      const outer = 100, inner = 42;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        pts.push([140 + r * Math.cos(a), 140 + r * Math.sin(a)]);
      }
      const result: Waypoint[] = [];
      for (let i = 0; i < pts.length; i++) {
        result.push(pts[i]);
        const next = pts[(i + 1) % pts.length];
        result.push([(pts[i][0] + next[0]) / 2, (pts[i][1] + next[1]) / 2]);
      }
      return result;
    })(),
  },
  {
    name: "하트",
    emoji: "❤️",
    waypoints: Array.from({ length: 40 }, (_, i): Waypoint => {
      const t = (i / 40) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      return [140 + x * 7, 140 + y * 7];
    }),
  },
];

export default function DrawingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapeIdx, setShapeIdx] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const drawnPoints = useRef<Waypoint[]>([]);

  const shape = SHAPES[shapeIdx];

  function computeCoverage(): number {
    const pts = drawnPoints.current;
    if (pts.length === 0) return 0;
    let hit = 0;
    for (const wp of shape.waypoints) {
      for (const dp of pts) {
        if (Math.hypot(wp[0] - dp[0], wp[1] - dp[1]) <= RADIUS) { hit++; break; }
      }
    }
    return hit / shape.waypoints.length;
  }

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, SIZE, SIZE);
    drawnPoints.current = [];
    setCoverage(0);
    setCleared(false);
  }

  function getPos(e: React.MouseEvent | React.TouchEvent): [number, number] | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width, sy = SIZE / rect.height;
    if ("touches" in e) {
      const t = (e as React.TouchEvent).touches[0];
      return [(t.clientX - rect.left) * sx, (t.clientY - rect.top) * sy];
    }
    const m = e as React.MouseEvent;
    return [(m.clientX - rect.left) * sx, (m.clientY - rect.top) * sy];
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const pos = getPos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(pos[0], pos[1]);
  }

  function continueDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const pos = getPos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = BRUSH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(59,130,246,0.6)";
    ctx.lineTo(pos[0], pos[1]);
    ctx.stroke();
    drawnPoints.current.push(pos);
    const cov = computeCoverage();
    setCoverage(cov);
    if (cov >= THRESHOLD && !cleared) setCleared(true);
  }

  function endDraw() {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
  }

  function nextShape() {
    clearCanvas();
    setShapeIdx(i => (i + 1) % SHAPES.length);
  }

  return (
    <div className="w-full">
      <PageHeader title="따라 그리기" emoji="✏️" backHref="/dashboard/games" />

      {/* Shape selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {SHAPES.map((s, i) => (
          <button
            key={s.name}
            onClick={() => { setShapeIdx(i); clearCanvas(); }}
            className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
              shapeIdx === i ? "bg-blue-500 text-white shadow" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #3B82F6, #6366F1)" }}
            animate={{ width: `${Math.min(coverage * 100, 100)}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
        <span className="text-sm font-bold text-blue-600 w-10">{Math.round(coverage * 100)}%</span>
      </div>

      {/* Canvas area */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ width: SIZE, height: SIZE, border: "2px solid #BFDBFE", background: "#F8FAFF" }}
      >
        {/* Guide dots */}
        <svg
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          width={SIZE}
          height={SIZE}
        >
          {shape.waypoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt[0]}
              cy={pt[1]}
              r={showHint ? 8 : 5}
              fill={showHint ? "#93C5FD" : "#BFDBFE"}
              stroke="#60A5FA"
              strokeWidth={showHint ? 1.5 : 1}
              opacity={0.8}
            />
          ))}
        </svg>

        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
          onMouseDown={startDraw}
          onMouseMove={continueDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={continueDraw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {cleared && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 rounded-2xl p-4 text-center"
            style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "2px solid #93C5FD" }}
          >
            <p className="text-xl font-black text-blue-700">🎉 잘 그렸어요!</p>
            <Button
              className="mt-2"
              onClick={nextShape}
              style={{ background: "linear-gradient(90deg,#3B82F6,#6366F1)", color: "white" }}
            >
              다음 모양 →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={clearCanvas}>🗑️ 지우기</Button>
        <Button
          variant="outline"
          size="sm"
          onMouseDown={() => setShowHint(true)}
          onMouseUp={() => setShowHint(false)}
          onTouchStart={() => setShowHint(true)}
          onTouchEnd={() => setShowHint(false)}
        >
          💡 힌트
        </Button>
      </div>

      <p className="mt-3 text-xs text-gray-400">파란 점들을 따라 그려요 · {Math.round(THRESHOLD * 100)}% 이상 채우면 성공!</p>
    </div>
  );
}
