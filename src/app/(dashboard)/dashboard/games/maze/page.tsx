"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

// ── Types ──────────────────────────────────────────────────────
type CellType = "normal" | "ice" | "teleport";
interface Cell {
  walls: [boolean, boolean, boolean, boolean]; // top right bottom left
  type: CellType;
  teleportId?: number;
}

const DIRS: [number, number, number, number][] = [
  [-1, 0, 0, 2], [0, 1, 1, 3], [1, 0, 2, 0], [0, -1, 3, 1],
];
const OPPOSITE = [2, 3, 0, 1] as const;
const MAX_LEVEL = 100;

// ── Helpers ────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Level config ───────────────────────────────────────────────
interface LevelConfig {
  size: number;
  hasFog: boolean;
  fogRadius: number;
  hasIce: boolean;
  iceRatio: number;
  hasTeleport: boolean;
  teleportPairs: number;
  hasOneWay: boolean;
  oneWayRatio: number;
}

function getLevelConfig(level: number): LevelConfig {
  // size: 5 at lv1, +2 every 5 levels, max 25 (capped at lv51)
  const step = Math.floor((level - 1) / 5);
  const size = Math.min(5 + step * 2, 25);
  return {
    size,
    hasFog: level >= 21,
    fogRadius: level >= 76 ? 2 : level >= 51 ? 3 : 4,
    hasIce: level >= 31,
    iceRatio: level >= 86 ? 0.26 : level >= 71 ? 0.19 : level >= 56 ? 0.13 : level >= 31 ? 0.07 : 0,
    hasTeleport: level >= 41,
    teleportPairs: level >= 81 ? 4 : level >= 66 ? 3 : level >= 51 ? 2 : 1,
    hasOneWay: level >= 56,
    oneWayRatio: level >= 86 ? 0.14 : level >= 71 ? 0.09 : level >= 56 ? 0.04 : 0,
  };
}

// ── Maze generation ────────────────────────────────────────────
interface MazeData {
  grid: Cell[][];
  blocked: Set<string>;            // "r,c,d" = cannot move FROM [r][c] in direction d
  teleports: [number, number][][]; // pairs[pairIdx] = [[r1,c1],[r2,c2]]
  config: LevelConfig;
}

function generateMaze(level: number): MazeData {
  const config = getLevelConfig(level);
  const { size } = config;

  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
      type: "normal" as CellType,
    }))
  );

  // Iterative DFS to avoid stack overflow on large maps
  const visited = Array.from({ length: size }, () => new Array(size).fill(false));
  const stack: [number, number][] = [[0, 0]];
  visited[0][0] = true;
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const dirs = shuffle([0, 1, 2, 3]);
    let moved = false;
    for (const d of dirs) {
      const [dr, dc, myWall, neighborWall] = DIRS[d];
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        grid[r][c].walls[myWall] = false;
        grid[nr][nc].walls[neighborWall] = false;
        visited[nr][nc] = true;
        stack.push([nr, nc]);
        moved = true;
        break;
      }
    }
    if (!moved) stack.pop();
  }

  // Ice floors
  if (config.hasIce && config.iceRatio > 0) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r === 0 && c === 0) || (r === size - 1 && c === size - 1)) continue;
        if (Math.random() < config.iceRatio) grid[r][c].type = "ice";
      }
    }
  }

  // Teleport pairs
  const teleports: [number, number][][] = [];
  if (config.hasTeleport) {
    const usedKeys = new Set(["0,0", `${size - 1},${size - 1}`]);
    for (let p = 0; p < config.teleportPairs; p++) {
      const pair: [number, number][] = [];
      let attempts = 0;
      while (pair.length < 2 && attempts < 400) {
        attempts++;
        const r = 1 + Math.floor(Math.random() * (size - 2));
        const c = 1 + Math.floor(Math.random() * (size - 2));
        const key = `${r},${c}`;
        if (!usedKeys.has(key) && grid[r][c].type === "normal") {
          grid[r][c].type = "teleport";
          grid[r][c].teleportId = p;
          usedKeys.add(key);
          pair.push([r, c]);
        }
      }
      if (pair.length === 2) teleports.push(pair);
    }
  }

  // One-way passages: block reverse direction of some open passages
  const blocked = new Set<string>();
  if (config.hasOneWay && config.oneWayRatio > 0) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r === 0 && c === 0) || (r === size - 1 && c === size - 1)) continue;
        for (let d = 0; d < 4; d++) {
          if (!grid[r][c].walls[d] && Math.random() < config.oneWayRatio) {
            const [dr, dc] = DIRS[d];
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
            // Allow [r][c]→[nr][nc], block [nr][nc]→[r][c]
            blocked.add(`${nr},${nc},${OPPOSITE[d]}`);
          }
        }
      }
    }
  }

  return { grid, blocked, teleports, config };
}

// ── Ice slide ─────────────────────────────────────────────────
function slideOnIce(
  grid: Cell[][], blocked: Set<string>,
  r: number, c: number, dr: number, dc: number, size: number
): [number, number] {
  const wallIdx = (dr === -1 ? 0 : dc === 1 ? 1 : dr === 1 ? 2 : 3) as 0 | 1 | 2 | 3;
  while (true) {
    if (grid[r][c].walls[wallIdx]) break;
    if (blocked.has(`${r},${c},${wallIdx}`)) break;
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
    r = nr; c = nc;
    if (grid[r][c].type !== "ice") break;
  }
  return [r, c];
}

// ── Teleport ──────────────────────────────────────────────────
function applyTeleport(
  grid: Cell[][], teleports: [number, number][][],
  r: number, c: number
): [number, number] {
  const cell = grid[r][c];
  if (cell.type !== "teleport" || cell.teleportId === undefined) return [r, c];
  const pair = teleports[cell.teleportId];
  if (!pair || pair.length < 2) return [r, c];
  const dest = pair.find(([pr, pc]) => pr !== r || pc !== c);
  return dest ? [dest[0], dest[1]] : [r, c];
}

// ── Sounds ────────────────────────────────────────────────────
function playBeep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch { /* ignore */ }
}

const playMoveSound  = () => playBeep(440, 0.06);
const playWallSound  = () => playBeep(160, 0.08, "square", 0.15);
const playIceSound   = () => playBeep(880, 0.18, "sine", 0.08);

function playTeleportSound() {
  try {
    const ctx = new AudioContext();
    [440, 660, 1047].forEach((f, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t); osc.stop(t + 0.12);
    });
    setTimeout(() => ctx.close(), 500);
  } catch { /* ignore */ }
}

function playWinMelody() {
  try {
    const ctx = new AudioContext();
    [523, 659, 784, 659, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.2);
    });
    setTimeout(() => ctx.close(), 900);
  } catch { /* ignore */ }
}

// ── Level range helpers ────────────────────────────────────────
const RANGE_COLORS = [
  { range: [1, 20],   color: "#10B981", label: "초급" },
  { range: [21, 40],  color: "#F59E0B", label: "안개" },
  { range: [41, 60],  color: "#F97316", label: "얼음+이동" },
  { range: [61, 80],  color: "#EF4444", label: "일방통행" },
  { range: [81, 100], color: "#8B5CF6", label: "최고난이도" },
];
function levelColor(lv: number) {
  return RANGE_COLORS.find(r => lv >= r.range[0] && lv <= r.range[1])?.color ?? "#6B7280";
}

// ── Main ──────────────────────────────────────────────────────
export default function MazeGame() {
  const initialLevel = (() => {
    if (typeof window === "undefined") return 1;
    return Math.min(Math.max(1, parseInt(localStorage.getItem("maze_level") ?? "1", 10)), MAX_LEVEL);
  })();

  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [mazeData, setMazeData]         = useState<MazeData>(() => generateMaze(initialLevel));
  const [pos, setPos]                   = useState<[number, number]>([0, 0]);
  const [trail, setTrail]               = useState<Set<string>>(new Set(["0,0"]));
  const [moves, setMoves]               = useState(0);
  const [elapsed, setElapsed]           = useState(0);
  const [startTime, setStartTime]       = useState(Date.now());
  const [won, setWon]                   = useState(false);
  const [dragXY, setDragXY]             = useState<{ x: number; y: number } | null>(null);
  const [vpSize, setVpSize]             = useState(320);

  const viewportRef  = useRef<HTMLDivElement>(null);
  const mazeRef      = useRef<HTMLDivElement>(null);
  const posRef       = useRef<[number, number]>([0, 0]);
  const isDragging   = useRef(false);
  const lastCell     = useRef("");
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const { grid, blocked, teleports, config } = mazeData;
  const { size, hasFog, fogRadius } = config;

  // Responsive viewport — 화면 가득 활용
  useEffect(() => {
    const update = () => setVpSize(Math.min(window.innerWidth - 24, 640));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const cellSize   = Math.max(22, Math.min(56, Math.floor(vpSize / size)));
  const mazePixels = cellSize * size;

  useEffect(() => { posRef.current = pos; }, [pos]);

  // Timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!won) {
      timerRef.current = setInterval(
        () => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000
      );
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [won, startTime]);

  // Auto-scroll to keep player centered
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const [r, c] = pos;
    vp.scrollTo({
      left: Math.max(0, c * cellSize - vpSize / 2 + cellSize / 2),
      top:  Math.max(0, r * cellSize - vpSize / 2 + cellSize / 2),
      behavior: "smooth",
    });
  }, [pos, cellSize, vpSize]);

  // Win handler
  useEffect(() => {
    if (!won) return;
    playWinMelody();
    const stars = moves <= size * 3 ? 3 : moves <= size * 5 ? 2 : 1;
    const msg = stars === 3 ? "별 세 개! 완벽해요!" : stars === 2 ? "별 두 개! 잘했어요!" : "별 한 개! 해냈어요!";
    setTimeout(() => speak(`${currentLevel}단계 클리어! ${msg}`, { lang: "ko" }), 600);
  }, [won]); // eslint-disable-line react-hooks/exhaustive-deps

  function initLevel(level: number) {
    const data = generateMaze(level);
    setMazeData(data);
    setPos([0, 0]); posRef.current = [0, 0];
    setTrail(new Set(["0,0"]));
    setMoves(0); setElapsed(0); setWon(false);
    setStartTime(Date.now());
    isDragging.current = false;
    lastCell.current = "";
    setDragXY(null);
    setCurrentLevel(level);
    localStorage.setItem("maze_level", String(level));
  }

  // Movement
  const move = useCallback((dr: number, dc: number) => {
    if (won) return;
    const [r, c] = posRef.current;
    const wallIdx = (dr === -1 ? 0 : dc === 1 ? 1 : dr === 1 ? 2 : 3) as 0 | 1 | 2 | 3;

    if (grid[r][c].walls[wallIdx]) { playWallSound(); return; }
    if (blocked.has(`${r},${c},${wallIdx}`)) { playWallSound(); return; }

    let nr = r + dr, nc = c + dc;

    // Ice slide
    if (grid[nr]?.[nc]?.type === "ice") {
      playIceSound();
      [nr, nc] = slideOnIce(grid, blocked, nr, nc, dr, dc, size);
    } else {
      playMoveSound();
    }

    // Teleport
    if (grid[nr]?.[nc]?.type === "teleport") {
      [nr, nc] = applyTeleport(grid, teleports, nr, nc);
      playTeleportSound();
    }

    posRef.current = [nr, nc];
    setMoves(m => m + 1);
    setTrail(t => new Set([...t, `${nr},${nc}`]));
    setPos([nr, nc]);
    if (nr === size - 1 && nc === size - 1) setWon(true);
  }, [won, grid, blocked, teleports, size]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp")    { e.preventDefault(); move(-1, 0); }
      if (e.key === "ArrowRight") { e.preventDefault(); move(0,  1); }
      if (e.key === "ArrowDown")  { e.preventDefault(); move(1,  0); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); move(0, -1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  // Touch drag (native, attached to viewport for scroll offset)
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const getCell = (cx: number, cy: number): [number, number] | null => {
      const rect = vp.getBoundingClientRect();
      const x = cx - rect.left + vp.scrollLeft;
      const y = cy - rect.top  + vp.scrollTop;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      if (row < 0 || row >= size || col < 0 || col >= size) return null;
      return [row, col];
    };

    const tryMove = (cx: number, cy: number) => {
      const cell = getCell(cx, cy);
      if (!cell) return;
      const key = `${cell[0]},${cell[1]}`;
      if (key === lastCell.current) return;
      lastCell.current = key;
      const [pr, pc] = posRef.current;
      const dr = cell[0] - pr, dc = cell[1] - pc;
      if (Math.abs(dr) + Math.abs(dc) === 1) move(dr, dc);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t0 = e.touches[0];
      const cell = getCell(t0.clientX, t0.clientY);
      if (!cell) return;
      const [pr, pc] = posRef.current;
      if (cell[0] !== pr || cell[1] !== pc) return;
      e.preventDefault();
      isDragging.current = true;
      lastCell.current = `${pr},${pc}`;
      const rect = vp.getBoundingClientRect();
      setDragXY({ x: t0.clientX - rect.left + vp.scrollLeft, y: t0.clientY - rect.top + vp.scrollTop });
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDragging.current) return;
      const t0 = e.touches[0];
      const rect = vp.getBoundingClientRect();
      setDragXY({ x: t0.clientX - rect.left + vp.scrollLeft, y: t0.clientY - rect.top + vp.scrollTop });
      tryMove(t0.clientX, t0.clientY);
    };
    const onTouchEnd = () => { isDragging.current = false; lastCell.current = ""; setDragXY(null); };

    vp.addEventListener("touchstart", onTouchStart, { passive: false });
    vp.addEventListener("touchmove",  onTouchMove,  { passive: false });
    vp.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      vp.removeEventListener("touchstart", onTouchStart);
      vp.removeEventListener("touchmove",  onTouchMove);
      vp.removeEventListener("touchend",   onTouchEnd);
    };
  }, [move, cellSize, size]);

  // Mouse drag
  const getCellPointer = (cx: number, cy: number): [number, number] | null => {
    const vp = viewportRef.current;
    if (!vp) return null;
    const rect = vp.getBoundingClientRect();
    const col = Math.floor((cx - rect.left + vp.scrollLeft) / cellSize);
    const row = Math.floor((cy - rect.top  + vp.scrollTop)  / cellSize);
    if (row < 0 || row >= size || col < 0 || col >= size) return null;
    return [row, col];
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const cell = getCellPointer(e.clientX, e.clientY);
    if (!cell) return;
    const [pr, pc] = posRef.current;
    if (cell[0] !== pr || cell[1] !== pc) return;
    e.preventDefault();
    isDragging.current = true;
    lastCell.current = `${pr},${pc}`;
    e.currentTarget.setPointerCapture(e.pointerId);
    const vp = viewportRef.current!;
    const rect = vp.getBoundingClientRect();
    setDragXY({ x: e.clientX - rect.left + vp.scrollLeft, y: e.clientY - rect.top + vp.scrollTop });
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || !isDragging.current) return;
    const vp = viewportRef.current!;
    const rect = vp.getBoundingClientRect();
    setDragXY({ x: e.clientX - rect.left + vp.scrollLeft, y: e.clientY - rect.top + vp.scrollTop });
    const cell = getCellPointer(e.clientX, e.clientY);
    if (!cell) return;
    const key = `${cell[0]},${cell[1]}`;
    if (key !== lastCell.current) {
      lastCell.current = key;
      const [pr, pc] = posRef.current;
      const dr = cell[0] - pr, dc = cell[1] - pc;
      if (Math.abs(dr) + Math.abs(dc) === 1) move(dr, dc);
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    isDragging.current = false; lastCell.current = ""; setDragXY(null);
  };

  const stars = moves <= size * 3 ? 3 : moves <= size * 5 ? 2 : 1;
  const lvColor = levelColor(currentLevel);

  const features = [
    config.hasFog      && { emoji: "🌫️", label: "안개",      color: "#6B7280" },
    config.hasIce      && { emoji: "❄️",  label: "얼음",      color: "#0EA5E9" },
    config.hasTeleport && { emoji: "🌀",  label: "순간이동",  color: "#8B5CF6" },
    config.hasOneWay   && { emoji: "⬆️",  label: "일방통행",  color: "#F97316" },
  ].filter(Boolean) as { emoji: string; label: string; color: string }[];

  return (
    <div className="w-full">
      <PageHeader title="미로 찾기" emoji="🌀" backHref="/dashboard/games" />

      {/* Level badge + 드롭다운 단계 선택 */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-white text-sm shadow flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${lvColor}, ${lvColor}cc)` }}
        >
          ⭐ {currentLevel}단계
        </div>
        {features.map(f => (
          <span
            key={f.label}
            className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
            style={{ background: f.color + "20", color: f.color, border: `1px solid ${f.color}40` }}
          >
            {f.emoji}
          </span>
        ))}
        {/* 드롭다운 단계 선택 */}
        <select
          value={currentLevel}
          onChange={(e) => initLevel(Number(e.target.value))}
          className="ml-auto text-xs font-bold rounded-xl px-2 py-1.5 cursor-pointer outline-none"
          style={{
            border: "2px solid #E5E7EB",
            background: "white",
            color: "#374151",
            minWidth: 100,
          }}
        >
          {RANGE_COLORS.map(({ range, label }) =>
            <optgroup key={label} label={label}>
              {Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i).map(lv => (
                <option key={lv} value={lv}>{lv}단계</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(currentLevel / MAX_LEVEL) * 100}%`,
            background: `linear-gradient(90deg, #10B981, #F59E0B, #EF4444, ${lvColor})`,
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
        <span>이동: <b className="text-blue-600">{moves}</b></span>
        <span>시간: <b className="text-blue-600">{elapsed}초</b></span>
        <span className="text-xs text-gray-400">{size}×{size}</span>
        <Button variant="outline" size="sm" onClick={() => initLevel(currentLevel)} className="ml-auto">
          다시 시작
        </Button>
      </div>

      {/* Win panel */}
      <AnimatePresence>
        {won && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="mb-4 rounded-2xl p-5 text-center"
            style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", border: "2px solid #93C5FD" }}
          >
            <p className="text-3xl mb-1">{"⭐".repeat(stars)}</p>
            <p className="text-xl font-black text-blue-700 mb-1">{currentLevel}단계 완성!</p>
            <p className="text-sm text-blue-500 mb-4">{moves}번 이동 · {elapsed}초</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button variant="outline" size="sm" onClick={() => initLevel(currentLevel)}>다시 하기</Button>
              {currentLevel < MAX_LEVEL ? (
                <Button
                  size="sm"
                  onClick={() => initLevel(currentLevel + 1)}
                  style={{ background: `linear-gradient(90deg, ${lvColor}, #3B82F6)`, color: "white" }}
                >
                  다음 단계 {currentLevel + 1} →
                </Button>
              ) : (
                <p className="text-purple-600 font-black text-sm self-center">🏆 100단계 전부 클리어!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable maze viewport */}
      <div
        ref={viewportRef}
        style={{
          width:  "100%",
          maxWidth: Math.min(vpSize, mazePixels) + 6,
          height: Math.min(vpSize, mazePixels) + 6,
          overflow: "auto",
          border: "3px solid #93C5FD",
          borderRadius: 18,
          touchAction: "none",
          scrollbarWidth: "none",
        }}
      >
        <div
          ref={mazeRef}
          className="relative select-none"
          style={{ width: mazePixels, height: mazePixels, cursor: dragXY ? "grabbing" : "default" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = pos[0] === r && pos[1] === c;
              const isGoal   = r === size - 1 && c === size - 1;
              const isTrail  = trail.has(`${r},${c}`) && !isPlayer;
              const dist     = Math.max(Math.abs(r - pos[0]), Math.abs(c - pos[1]));
              const fogHide  = hasFog && dist > fogRadius;
              const fogDim   = hasFog && dist === fogRadius + 1;

              // Background
              let bg = "white";
              if (isGoal)              bg = "#DBEAFE";
              else if (cell.type === "ice")      bg = "#E0F7FF";
              else if (cell.type === "teleport") bg = "#EDE9FE";
              else if (isTrail)        bg = "#F0FDF4";

              // Wall/one-way borders
              const borders = [0, 1, 2, 3].map(d => {
                if (cell.walls[d])                    return "2px solid #93C5FD";
                if (blocked.has(`${r},${c},${d}`))    return "2px dashed #F97316";
                return "none";
              });

              return (
                <div
                  key={`${r}-${c}`}
                  style={{
                    position: "absolute",
                    left: c * cellSize, top: r * cellSize,
                    width: cellSize, height: cellSize,
                    background: fogHide ? "#1E293B" : bg,
                    opacity: fogDim ? 0.4 : 1,
                    borderTop: borders[0], borderRight: borders[1],
                    borderBottom: borders[2], borderLeft: borders[3],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxSizing: "border-box",
                    transition: "background 0.15s, opacity 0.3s",
                    userSelect: "none",
                  }}
                >
                  {!fogHide && (
                    isPlayer ? (
                      <motion.span
                        key={`p-${r}-${c}`}
                        initial={{ scale: 0.7 }}
                        animate={{ scale: dragXY ? 0.5 : 1, opacity: dragXY ? 0.35 : 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        style={{ display: "block", fontSize: cellSize * 0.82, cursor: "grab", userSelect: "none", lineHeight: 1 }}
                      >🐣</motion.span>
                    ) : isGoal ? <span style={{ fontSize: cellSize * 0.72 }}>🏠</span>
                      : cell.type === "teleport" ? <span style={{ fontSize: cellSize * 0.52 }}>🌀</span>
                      : cell.type === "ice" ? <span style={{ fontSize: cellSize * 0.38, opacity: 0.7 }}>❄</span>
                      : isTrail ? <span style={{ fontSize: cellSize * 0.22, color: "#86EFAC" }}>●</span>
                      : null
                  )}
                </div>
              );
            })
          )}

          {/* Drag ghost */}
          {dragXY && (
            <div
              style={{
                position: "absolute",
                left: dragXY.x, top: dragXY.y,
                transform: "translate(-50%, -50%)",
                fontSize: cellSize * 1.1,
                pointerEvents: "none", zIndex: 10,
                filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35))",
                userSelect: "none",
                lineHeight: 1,
              }}
            >🐣</div>
          )}
        </div>
      </div>

      {/* Legend */}
      {features.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: "#9CA3AF" }}>
          {config.hasFog      && <span>🌫️ 안개: 시야 제한</span>}
          {config.hasIce      && <span>❄️ 얼음: 미끄러짐</span>}
          {config.hasTeleport && <span>🌀 순간이동 패드</span>}
          {config.hasOneWay   && <span style={{ color: "#F97316" }}>주황점선: 한 방향만</span>}
        </div>
      )}

      <p className="mt-3 text-xs text-center" style={{ color: "#9CA3AF" }}>
        🐣를 꾹 누르고 드래그 · 키보드 방향키로 조작 · 🏠까지 가세요!
      </p>
    </div>
  );
}
