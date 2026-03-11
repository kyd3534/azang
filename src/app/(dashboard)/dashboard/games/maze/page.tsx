"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

type Cell = { walls: [boolean, boolean, boolean, boolean] };

const DIRS: [number, number, number, number][] = [
  [-1, 0, 0, 2],
  [0, 1, 1, 3],
  [1, 0, 2, 0],
  [0, -1, 3, 1],
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateMaze(size: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
    }))
  );
  const visited = Array.from({ length: size }, () => new Array(size).fill(false));

  function dfs(r: number, c: number) {
    visited[r][c] = true;
    for (const [dr, dc, myWall, neighborWall] of shuffle(DIRS)) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        grid[r][c].walls[myWall] = false;
        grid[nr][nc].walls[neighborWall] = false;
        dfs(nr, nc);
      }
    }
  }
  dfs(0, 0);
  return grid;
}

// ── 효과음 ─────────────────────────────────────────────────────────────────────
function playMoveSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
    osc.onended = () => ctx.close();
  } catch { /* ignore */ }
}

function playWallSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = 160;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
    osc.onended = () => ctx.close();
  } catch { /* ignore */ }
}

function playWinMelody() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 659, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    });
    setTimeout(() => ctx.close(), 900);
  } catch { /* ignore */ }
}
// ──────────────────────────────────────────────────────────────────────────────

const LEVELS = [
  { label: "쉬움", size: 5 },
  { label: "보통", size: 7 },
  { label: "어려움", size: 9 },
];

export default function MazeGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [maze, setMaze] = useState<Cell[][]>(() => generateMaze(LEVELS[0].size));
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [trail, setTrail] = useState<Set<string>>(new Set(["0,0"]));
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [won, setWon] = useState(false);
  const touchStart = useRef<[number, number] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 현재 pos를 ref로 동기화 — move 시 벽 감지에 사용
  const posRef = useRef<[number, number]>([0, 0]);

  const size = LEVELS[levelIdx].size;
  const cellSize = Math.floor(340 / size);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!won) {
      timerRef.current = setInterval(
        () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
        1000
      );
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [won, startTime]);

  const move = useCallback(
    (dr: number, dc: number) => {
      if (won) return;
      const [r, c] = posRef.current;
      const wallIdx = dr === -1 ? 0 : dc === 1 ? 1 : dr === 1 ? 2 : 3;

      // 벽 막힘 감지 → 효과음 분리
      if (maze[r][c].walls[wallIdx]) {
        playWallSound();
        return;
      }

      playMoveSound();
      const nr = r + dr, nc = c + dc;
      setMoves(m => m + 1);
      setTrail(t => new Set([...t, `${nr},${nc}`]));
      setPos([nr, nc]);

      if (nr === size - 1 && nc === size - 1) {
        setWon(true);
      }
    },
    [won, maze, size]
  );

  // 완성 시 음성
  useEffect(() => {
    if (!won) return;
    const stars = moves <= size * 3 ? 3 : moves <= size * 5 ? 2 : 1;
    const starText = ["한 개", "두 개", "세 개"][stars - 1];
    playWinMelody();
    setTimeout(() => {
      speak(`완성이에요! 별 ${starText}를 받았어요! 대단해요!`, { lang: "ko" });
    }, 700);
  }, [won]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
      else if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  function reset(idx = levelIdx) {
    const s = LEVELS[idx].size;
    setMaze(generateMaze(s));
    setPos([0, 0]);
    posRef.current = [0, 0];
    setTrail(new Set(["0,0"]));
    setMoves(0);
    setElapsed(0);
    setWon(false);
    setStartTime(Date.now());
  }

  const stars = moves <= size * 3 ? 3 : moves <= size * 5 ? 2 : 1;

  return (
    <div className="w-full">
      <PageHeader title="미로 찾기" emoji="🌀" backHref="/dashboard/games" />

      {/* Difficulty */}
      <div className="flex gap-2 mb-5">
        {LEVELS.map((lv, i) => (
          <button
            key={lv.label}
            onClick={() => { setLevelIdx(i); reset(i); }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              levelIdx === i
                ? "bg-blue-500 text-white shadow-md"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            {lv.label} ({lv.size}×{lv.size})
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <span>이동: <b className="text-blue-600">{moves}</b></span>
        <span>시간: <b className="text-blue-600">{elapsed}초</b></span>
        <Button variant="outline" size="sm" onClick={() => reset()}>다시 시작</Button>
      </div>

      {/* Win banner */}
      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="mb-5 rounded-2xl p-5 text-center"
            style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "2px solid #93C5FD" }}
          >
            <p className="text-2xl font-black text-blue-700 mb-1">{"⭐".repeat(stars)} 완성!</p>
            <p className="text-sm text-blue-500 mb-3">{moves}번 이동 · {elapsed}초</p>
            <Button
              onClick={() => reset()}
              style={{ background: "linear-gradient(90deg,#3B82F6,#6366F1)", color: "white" }}
            >
              다시 하기
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Maze grid */}
      <div
        className="relative select-none touch-none"
        style={{
          width: cellSize * size,
          height: cellSize * size,
          border: "3px solid #93C5FD",
          borderRadius: 10,
          overflow: "hidden",
        }}
        onTouchStart={e => {
          const t = e.touches[0];
          touchStart.current = [t.clientY, t.clientX];
        }}
        onTouchEnd={e => {
          if (!touchStart.current) return;
          const t = e.changedTouches[0];
          const dy = t.clientY - touchStart.current[0];
          const dx = t.clientX - touchStart.current[1];
          touchStart.current = null;
          if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < -20) move(-1, 0);
            else if (dy > 20) move(1, 0);
          } else {
            if (dx < -20) move(0, -1);
            else if (dx > 20) move(0, 1);
          }
        }}
      >
        {maze.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer = pos[0] === r && pos[1] === c;
            const isGoal = r === size - 1 && c === size - 1;
            const isTrail = trail.has(`${r},${c}`) && !isPlayer;
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  position: "absolute",
                  left: c * cellSize,
                  top: r * cellSize,
                  width: cellSize,
                  height: cellSize,
                  background: isGoal ? "#DBEAFE" : isTrail ? "#F0FDF4" : "white",
                  borderTop: cell.walls[0] ? "2px solid #93C5FD" : "none",
                  borderRight: cell.walls[1] ? "2px solid #93C5FD" : "none",
                  borderBottom: cell.walls[2] ? "2px solid #93C5FD" : "none",
                  borderLeft: cell.walls[3] ? "2px solid #93C5FD" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: cellSize * 0.55,
                  boxSizing: "border-box",
                  transition: "background 0.2s",
                }}
              >
                {isPlayer ? "🐣" : isGoal ? "🏠" : isTrail ? (
                  <span style={{ fontSize: cellSize * 0.2, color: "#86EFAC" }}>●</span>
                ) : ""}
              </div>
            );
          })
        )}
      </div>

      {/* D-pad */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => move(-1, 0)} className="w-12 h-12 text-xl">↑</Button>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => move(0, -1)} className="w-12 h-12 text-xl">←</Button>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🎮</div>
          <Button variant="outline" size="sm" onClick={() => move(0, 1)} className="w-12 h-12 text-xl">→</Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => move(1, 0)} className="w-12 h-12 text-xl">↓</Button>
      </div>

      <p className="mt-4 text-xs text-gray-400">🐣을 🏠까지 데려다줘요 · 방향키 또는 화면 스와이프</p>
    </div>
  );
}
