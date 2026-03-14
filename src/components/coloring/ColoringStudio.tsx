"use client";

import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { playFillSound, playBrushSound, stopBrushSound, playEraserSound } from "@/lib/coloring-sound";

// ── 24 색상 팔레트 ─────────────────────────────────────────────────────────
const PALETTE: readonly string[] = [
  // 파스텔
  "#FFB3C1", "#B3D9FF", "#B3FFD9", "#D9B3FF", "#FFCBA4", "#FFFAB3",
  "#FFD6E0", "#C8F0FF",
  // 원색
  "#FF3366", "#FF8C00", "#FFD700", "#00CC44", "#0066FF", "#9933FF",
  "#FF0099", "#00CCFF",
  // 중간·무채색
  "#FFFFFF", "#E0E0E0", "#A0A0A0", "#6B7280",
  "#A0522D", "#4A2F1A", "#000000", "#FDBCB4",
] as const;

type Tool = "fill" | "brush" | "eraser";

// ── 도구 SVG 아이콘 ───────────────────────────────────────────────────────────
function FillIcon({ c = "currentColor", s = 18 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 11-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11Z" />
      <path d="m5 2 5 5" />
      <path d="M2 13h15" />
      <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
    </svg>
  );
}
function BrushIcon({ c = "currentColor", s = 18 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.5 1 2 6.5 1.5 7-2 .24-1.64-1-3.52-2-3.52Z" />
    </svg>
  );
}
function EraserIcon({ c = "currentColor", s = 18 }: { c?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
}

// 빠른 색상 선택 (항상 표시)
const QUICK_COLORS = ["#FF3366", "#FF8C00", "#FFD700", "#00CC44", "#0066FF", "#9933FF", "#FF0099", "#000000"] as const;

// ── 헬퍼: HEX → RGB ──────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

// ── SVG 흰색 fill 제거 (fill 캔버스가 비치도록) ──────────────────────────────
function stripWhiteFills(svg: string): string {
  return svg
    .replace(/\bfill="white"\b/g, 'fill="none"')
    .replace(/\bfill="#ffffff"\b/gi, 'fill="none"')
    .replace(/\bfill="#fff"\b/gi, 'fill="none"');
}

// ── 캔버스 플러드 필 (BFS) ───────────────────────────────────────────────────
function floodFill(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sx: number,
  sy: number,
  fillR: number,
  fillG: number,
  fillB: number,
  boundaryData: Uint8ClampedArray | null,
  tolerance = 35,
): void {
  const x0 = Math.round(sx), y0 = Math.round(sy);
  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return;

  const startPos = y0 * width + x0;
  const [sr, sg, sb] = [data[startPos * 4], data[startPos * 4 + 1], data[startPos * 4 + 2]];

  if (sr === fillR && sg === fillG && sb === fillB) return;

  function isDark(pos: number): boolean {
    const src = boundaryData ?? data;
    const i = pos * 4;
    return src[i] < 80 && src[i + 1] < 80 && src[i + 2] < 80;
  }

  if (isDark(startPos)) return;

  function matches(pos: number): boolean {
    if (isDark(pos)) return false;
    const i = pos * 4;
    return (
      Math.abs(data[i] - sr) <= tolerance &&
      Math.abs(data[i + 1] - sg) <= tolerance &&
      Math.abs(data[i + 2] - sb) <= tolerance
    );
  }

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;

  queue[tail++] = startPos;
  visited[startPos] = 1;

  while (head < tail) {
    const pos = queue[head++];
    const x = pos % width;
    const y = (pos - x) / width;

    const i = pos * 4;
    data[i] = fillR;
    data[i + 1] = fillG;
    data[i + 2] = fillB;
    data[i + 3] = 255;

    if (x > 0 && !visited[pos - 1] && matches(pos - 1)) {
      visited[pos - 1] = 1; queue[tail++] = pos - 1;
    }
    if (x < width - 1 && !visited[pos + 1] && matches(pos + 1)) {
      visited[pos + 1] = 1; queue[tail++] = pos + 1;
    }
    if (y > 0 && !visited[pos - width] && matches(pos - width)) {
      visited[pos - width] = 1; queue[tail++] = pos - width;
    }
    if (y < height - 1 && !visited[pos + width] && matches(pos + width)) {
      visited[pos + width] = 1; queue[tail++] = pos + width;
    }
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface ColoringStudioProps {
  svgContent: string;
  pageId: string;
  title?: string;
  initialFills?: Record<string, string>;
  persistToDb?: boolean;
}

export default function ColoringStudio({
  svgContent,
  pageId,
  title,
  persistToDb = true,
}: ColoringStudioProps) {
  const [tool, setTool] = useState<Tool>("fill");
  const [color, setColor] = useState("#FFB3C1");
  const [brushSize, setBrushSize] = useState(15);
  const [undoCount, setUndoCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fillCanvasRef = useRef<HTMLCanvasElement>(null);
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);

  type UndoEntry =
    | { canvas: "fill" | "brush"; snapshot: ImageData }
    | { canvas: "both"; fillSnapshot: ImageData; brushSnapshot: ImageData };
  const undoStack = useRef<UndoEntry[]>([]);
  const boundaryRef = useRef<Uint8ClampedArray | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasPen = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();
  const displaySvg = stripWhiteFills(svgContent);

  // ── 캔버스 크기 동기화 ────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const fc = fillCanvasRef.current;
    const bc = brushCanvasRef.current;
    if (!container || !fc || !bc) return;

    function sync() {
      const { width, height } = container!.getBoundingClientRect();
      const w = Math.floor(width), h = Math.floor(height);
      if (w <= 0 || h <= 0) return;
      if (fc!.width === w && fc!.height === h) return;

      const fCtx = fc!.getContext("2d");
      let fSaved: ImageData | null = null;
      if (fCtx && fc!.width > 0) {
        try { fSaved = fCtx.getImageData(0, 0, fc!.width, fc!.height); } catch { /* */ }
      }

      const bCtx = bc!.getContext("2d");
      let bSaved: ImageData | null = null;
      if (bCtx && bc!.width > 0) {
        try { bSaved = bCtx.getImageData(0, 0, bc!.width, bc!.height); } catch { /* */ }
      }

      fc!.width = w; fc!.height = h;
      bc!.width = w; bc!.height = h;

      if (fCtx) {
        fCtx.fillStyle = "white";
        fCtx.fillRect(0, 0, w, h);
        if (fSaved) fCtx.putImageData(fSaved, 0, 0);
      }
      if (bCtx && bSaved) bCtx.putImageData(bSaved, 0, 0);

      boundaryRef.current = null;
    }

    const ro = new ResizeObserver(sync);
    ro.observe(container);
    sync();
    return () => ro.disconnect();
  }, []);

  // ── SVG → 경계 픽셀 데이터 (캐시) ──────────────────────────────────────────
  async function getBoundary(): Promise<Uint8ClampedArray | null> {
    if (boundaryRef.current) return boundaryRef.current;
    const fc = fillCanvasRef.current;
    if (!fc || fc.width <= 0) return null;

    try {
      const tmp = document.createElement("canvas");
      tmp.width = fc.width;
      tmp.height = fc.height;
      const ctx = tmp.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, tmp.width, tmp.height);

      await new Promise<void>((res) => {
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, tmp.width, tmp.height); URL.revokeObjectURL(url); res(); };
        img.onerror = () => { URL.revokeObjectURL(url); res(); };
        img.src = url;
      });

      boundaryRef.current = ctx.getImageData(0, 0, tmp.width, tmp.height).data;
      return boundaryRef.current;
    } catch {
      return null;
    }
  }

  // ── DB 저장 ──────────────────────────────────────────────────────────────
  function scheduleSave() {
    if (!persistToDb) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const fc = fillCanvasRef.current;
      const bc = brushCanvasRef.current;
      if (!fc) return;
      try {
        supabase.from("coloring_strokes").upsert({
          page_id: pageId,
          strokes: {
            v: 2,
            fill: fc.toDataURL(),
            brush: bc?.toDataURL() ?? null,
          },
        });
      } catch { /* ignore */ }
    }, 800);
  }

  // ── 채우기 ────────────────────────────────────────────────────────────────
  async function handleContainerClick(e: React.MouseEvent<HTMLDivElement>) {
    if (tool !== "fill") return;
    const fc = fillCanvasRef.current;
    const container = containerRef.current;
    if (!fc || !container) return;

    const rect = container.getBoundingClientRect();
    const scaleX = fc.width / rect.width;
    const scaleY = fc.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const ctx = fc.getContext("2d");
    if (!ctx) return;

    const boundary = await getBoundary();
    const imageData = ctx.getImageData(0, 0, fc.width, fc.height);
    const snapshot = ctx.getImageData(0, 0, fc.width, fc.height);

    const [r, g, b] = hexToRgb(color);
    floodFill(imageData.data, fc.width, fc.height, cx, cy, r, g, b, boundary);
    ctx.putImageData(imageData, 0, 0);

    undoStack.current = [...undoStack.current.slice(-19), { canvas: "fill", snapshot }];
    setUndoCount(undoStack.current.length);
    playFillSound();
    scheduleSave();
  }

  // ── 브러시 좌표 ──────────────────────────────────────────────────────────
  function getBrushPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const bc = brushCanvasRef.current!;
    const rect = bc.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (bc.width / rect.width),
      y: (e.clientY - rect.top) * (bc.height / rect.height),
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (tool === "fill") return;
    if (e.pointerType === "pen") hasPen.current = true;
    if (e.pointerType === "touch" && hasPen.current) return;
    e.preventDefault();
    const bc = brushCanvasRef.current;
    const ctx = bc?.getContext("2d");
    if (!bc || !ctx) return;

    const snap = ctx.getImageData(0, 0, bc.width, bc.height);
    undoStack.current = [...undoStack.current.slice(-19), { canvas: "brush", snapshot: snap }];
    setUndoCount(undoStack.current.length);

    isDrawing.current = true;
    lastPos.current = getBrushPos(e);
    bc.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    if (e.pointerType === "touch" && hasPen.current) return;
    e.preventDefault();
    const bc = brushCanvasRef.current;
    const ctx = bc?.getContext("2d");
    if (!bc || !ctx || !lastPos.current) return;

    const pos = getBrushPos(e);
    const pressure = e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.5;
    const base = tool === "eraser" ? brushSize * 2.5 : brushSize;
    const size = tool === "eraser" ? base : base * (0.4 + pressure * 0.6);

    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;

    if (tool === "brush") playBrushSound();
    else if (tool === "eraser") playEraserSound();
  }

  function handlePointerUp() {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPos.current = null;
      stopBrushSound();
      scheduleSave();
    }
  }

  // ── 되돌리기 ────────────────────────────────────────────────────────────
  function handleUndo() {
    if (undoStack.current.length === 0) return;
    const action = undoStack.current.pop()!;
    setUndoCount(undoStack.current.length);
    if (action.canvas === "both") {
      const fc = fillCanvasRef.current;
      const bc = brushCanvasRef.current;
      if (fc) { const ctx = fc.getContext("2d"); if (ctx) { ctx.fillStyle = "white"; ctx.fillRect(0, 0, fc.width, fc.height); ctx.putImageData(action.fillSnapshot, 0, 0); } }
      if (bc) { const ctx = bc.getContext("2d"); if (ctx) { ctx.clearRect(0, 0, bc.width, bc.height); ctx.putImageData(action.brushSnapshot, 0, 0); } }
    } else {
      const cvs = action.canvas === "fill" ? fillCanvasRef.current : brushCanvasRef.current;
      const ctx = cvs?.getContext("2d");
      if (cvs && ctx) ctx.putImageData(action.snapshot, 0, 0);
    }
  }

  // ── 초기화 (confirm 없이 바로 지우고 undo 스택에 저장) ──────────────────
  function handleClear() {
    const fc = fillCanvasRef.current;
    const bc = brushCanvasRef.current;
    const fCtx = fc?.getContext("2d");
    const bCtx = bc?.getContext("2d");
    if (!fc || !fCtx) return;
    // 현재 상태를 undo 스택에 저장
    const fillSnap = fCtx.getImageData(0, 0, fc.width, fc.height);
    const brushSnap = bCtx && bc ? bCtx.getImageData(0, 0, bc.width, bc.height) : null;
    if (brushSnap && bc) {
      undoStack.current = [...undoStack.current.slice(-19), { canvas: "both", fillSnapshot: fillSnap, brushSnapshot: brushSnap }];
    } else {
      undoStack.current = [...undoStack.current.slice(-19), { canvas: "fill", snapshot: fillSnap }];
    }
    setUndoCount(undoStack.current.length);
    // 캔버스 지우기
    fCtx.fillStyle = "white"; fCtx.fillRect(0, 0, fc.width, fc.height);
    if (bc && bCtx) bCtx.clearRect(0, 0, bc.width, bc.height);
    if (persistToDb) supabase.from("coloring_strokes").upsert({ page_id: pageId, strokes: {} });
  }

  // ── PNG 저장 ─────────────────────────────────────────────────────────────
  async function handleSave() {
    const fc = fillCanvasRef.current;
    const bc = brushCanvasRef.current;
    const container = containerRef.current;
    if (!fc || !container) return;
    try {
      const off = document.createElement("canvas");
      off.width = fc.width; off.height = fc.height;
      const ctx = off.getContext("2d")!;

      ctx.drawImage(fc, 0, 0);

      const svgEl = container.querySelector("svg");
      if (svgEl) {
        const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        await new Promise<void>((res) => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0, off.width, off.height); URL.revokeObjectURL(url); res(); };
          img.onerror = () => { URL.revokeObjectURL(url); res(); };
          img.src = url;
        });
      }

      if (bc) ctx.drawImage(bc, 0, 0);

      const a = document.createElement("a");
      a.href = off.toDataURL("image/png");
      a.download = `${title ?? "coloring"}.png`;
      a.click();
    } catch (err) {
      console.warn("저장 실패:", err);
    }
  }

  const TOOL_DEFS: { id: Tool; label: string; Icon: React.FC<{ c?: string; s?: number }> }[] = [
    { id: "fill",   label: "채우기", Icon: FillIcon },
    { id: "brush",  label: "붓",     Icon: BrushIcon },
    { id: "eraser", label: "지우개",  Icon: EraserIcon },
  ];

  const toolColor = (id: Tool) =>
    id === "eraser" ? "#EF4444" : id === "fill" ? "#4F46E5" : "#A21CAF";
  const toolBg = (id: Tool) =>
    id === "eraser" ? "#FEF2F2" : id === "fill" ? "#EEF2FF" : "#FDF4FF";
  const toolBorder = (id: Tool) =>
    id === "eraser" ? "#FCA5A5" : id === "fill" ? "#A5B4FC" : "#E879F9";

  return (
    <div className="flex flex-col gap-2 select-none h-full">

      {/* ── Row 1: 도구 + 색상 + 액션 ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 도구 3개 */}
        <div className="flex gap-1.5">
          {TOOL_DEFS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all px-3 py-2"
              style={{
                background: tool === id ? toolBg(id) : "#F1F5F9",
                border: `2px solid ${tool === id ? toolBorder(id) : "transparent"}`,
                boxShadow: tool === id ? "0 2px 8px rgba(0,0,0,0.10)" : "none",
                minWidth: 56,
              }}
              title={label}
            >
              <Icon c={tool === id ? toolColor(id) : "#9CA3AF"} s={20} />
              <span className="text-[10px] font-bold leading-none mt-0.5"
                style={{ color: tool === id ? toolColor(id) : "#9CA3AF" }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* 크기 슬라이더 (붓/지우개, 인라인) */}
        {tool !== "fill" && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl flex-shrink-0"
            style={{ background: "white", border: "2px solid #E5E7EB" }}>
            <div className="rounded-full flex-shrink-0"
              style={{
                width: Math.min(Math.max(brushSize * 0.55, 8), 20),
                height: Math.min(Math.max(brushSize * 0.55, 8), 20),
                background: tool === "brush" ? color : "#D1D5DB",
                border: "1.5px solid #E5E7EB",
                transition: "all 0.1s",
              }}
            />
            <input
              type="range"
              min={tool === "eraser" ? 10 : 4}
              max={tool === "eraser" ? 50 : 30}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ width: 72, cursor: "pointer" }}
            />
          </div>
        )}

        {/* 구분선 */}
        <div style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0 }} />

        {/* 현재 색 + 퀵 컬러 */}
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto min-w-0">
          <div className="rounded-full flex-shrink-0 cursor-pointer"
            style={{ width: 26, height: 26, background: color, border: "3px solid white", boxShadow: "0 0 0 2.5px #6366F1" }}
            title="현재 색상"
          />
          <div style={{ width: 1, height: 20, background: "#E5E7EB", flexShrink: 0 }} />
          {QUICK_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className="rounded-full flex-shrink-0 transition-transform"
              style={{
                width: 22, height: 22, background: c,
                border: color === c ? "2.5px solid #4F46E5" : "2px solid #D1D5DB",
                transform: color === c ? "scale(1.25)" : "scale(1)",
              }}
            />
          ))}
          <button onClick={() => setPaletteOpen((p) => !p)}
            className="rounded-full flex-shrink-0 flex items-center justify-center font-black text-xs"
            style={{
              width: 22, height: 22,
              background: paletteOpen ? "#4F46E5" : "#F3F4F6",
              color: paletteOpen ? "white" : "#6B7280",
              border: "2px dashed #D1D5DB",
            }}
          >{paletteOpen ? "▲" : "＋"}</button>
        </div>

        {/* 구분선 */}
        <div style={{ width: 1, height: 32, background: "#E5E7EB", flexShrink: 0 }} />

        {/* 액션 버튼 */}
        <div className="flex gap-1 flex-shrink-0">
          {/* 실행취소 */}
          <button onClick={handleUndo} disabled={undoCount === 0}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "#EFF6FF", color: undoCount === 0 ? "#BFDBFE" : "#3B82F6", border: "2px solid #BFDBFE" }}
            title="실행취소">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6"/><path d="M3 13C5 8.333 8.4 6 13 6c5 0 8 3.333 8 8s-3 8-8 8c-3 0-5.5-1-7-3"/>
            </svg>
          </button>
          {/* 초기화 */}
          <button onClick={handleClear}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#FEF2F2", color: "#EF4444", border: "2px solid #FECACA" }}
            title="초기화">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
          {/* 저장 */}
          <button onClick={handleSave}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "white" }}
            title="이미지 저장">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Row 2: 전체 팔레트 (펼침 시) ── */}
      {paletteOpen && (
        <div className="rounded-2xl p-3 flex-shrink-0"
          style={{ background: "white", border: "2px solid #E5E7EB" }}>
          <div className="flex flex-wrap gap-1.5 items-center">
            {PALETTE.map((c, idx) => (
              <button key={`pal-${idx}`}
                onClick={() => { setColor(c); setPaletteOpen(false); }}
                className="rounded-full transition-all"
                style={{
                  width: 28, height: 28, background: c,
                  border: color === c ? "3px solid #4F46E5" : "2px solid #D1D5DB",
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                  boxShadow: color === c ? "0 0 0 2px white, 0 0 0 4px #4F46E5" : "none",
                }}
              />
            ))}
            <label className="rounded-full flex items-center justify-center cursor-pointer text-lg"
              style={{ width: 28, height: 28, border: "2px dashed #D1D5DB", background: "white", color: "#9CA3AF" }}
              title="직접 색 고르기">
              +
              <input type="color" value={color}
                onChange={(e) => { setColor(e.target.value); setPaletteOpen(false); }}
                className="sr-only" />
            </label>
          </div>
        </div>
      )}

      {/* ── 캔버스 영역 (남은 공간 전부 사용) ── */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden flex-1 min-h-0"
        style={{
          border: "3px solid #E5E7EB",
          cursor: tool === "fill" ? "crosshair" : "default",
          background: "white",
        }}
        onClick={handleContainerClick}
      >
        <canvas ref={fillCanvasRef} className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1, pointerEvents: "none" }} />
        <div className="absolute inset-0 w-full h-full"
          style={{ zIndex: 2, pointerEvents: "none", lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${displaySvg}</div>` }}
        />
        <canvas ref={brushCanvasRef} className="absolute inset-0 w-full h-full"
          style={{
            zIndex: 3, touchAction: "none",
            pointerEvents: tool !== "fill" ? "auto" : "none",
            cursor: tool === "brush" ? "crosshair" : tool === "eraser" ? "cell" : "default",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}
