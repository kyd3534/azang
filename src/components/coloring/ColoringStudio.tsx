"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";

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

// ── 캔버스 플러드 필 (BFS, head-pointer 방식으로 O(n)) ──────────────────────
function floodFill(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sx: number,
  sy: number,
  fillR: number,
  fillG: number,
  fillB: number,
  boundaryData: Uint8ClampedArray | null, // SVG 윤곽선 픽셀
  tolerance = 35,
): void {
  const x0 = Math.round(sx), y0 = Math.round(sy);
  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return;

  const startPos = y0 * width + x0;
  const [sr, sg, sb] = [data[startPos * 4], data[startPos * 4 + 1], data[startPos * 4 + 2]];

  // 이미 같은 색이면 스킵
  if (sr === fillR && sg === fillG && sb === fillB) return;

  // 경계(윤곽선) 판단 - 픽셀이 어두우면 경계
  function isDark(pos: number): boolean {
    const src = boundaryData ?? data;
    const i = pos * 4;
    return src[i] < 80 && src[i + 1] < 80 && src[i + 2] < 80;
  }

  if (isDark(startPos)) return; // 경계 위를 클릭하면 무시

  function matches(pos: number): boolean {
    if (isDark(pos)) return false;
    const i = pos * 4;
    return (
      Math.abs(data[i] - sr) <= tolerance &&
      Math.abs(data[i + 1] - sg) <= tolerance &&
      Math.abs(data[i + 2] - sb) <= tolerance
    );
  }

  // BFS
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height); // 최대 픽셀 수만큼 pre-allocate
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
  initialFills?: Record<string, string>; // API 호환용 (미사용)
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

  // 3-레이어: fillCanvas(z1) → SVG 윤곽(z2) → brushCanvas(z3)
  const containerRef = useRef<HTMLDivElement>(null);
  const fillCanvasRef = useRef<HTMLCanvasElement>(null);   // 채우기 색상
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);  // 브러시/지우개

  type UndoEntry = { canvas: "fill" | "brush"; snapshot: ImageData };
  const undoStack = useRef<UndoEntry[]>([]);
  const boundaryRef = useRef<Uint8ClampedArray | null>(null); // SVG 경계 캐시
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasPen = useRef(false); // 팜 리젝션용
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();
  const displaySvg = stripWhiteFills(svgContent);

  // ── 캔버스 크기 → 컨테이너에 동기화 ────────────────────────────────────────
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

      // fill canvas 내용 보존
      const fCtx = fc!.getContext("2d");
      let fSaved: ImageData | null = null;
      if (fCtx && fc!.width > 0) {
        try { fSaved = fCtx.getImageData(0, 0, fc!.width, fc!.height); } catch { /* */ }
      }

      // brush canvas 내용 보존
      const bCtx = bc!.getContext("2d");
      let bSaved: ImageData | null = null;
      if (bCtx && bc!.width > 0) {
        try { bSaved = bCtx.getImageData(0, 0, bc!.width, bc!.height); } catch { /* */ }
      }

      fc!.width = w; fc!.height = h;
      bc!.width = w; bc!.height = h;

      // fill canvas 배경을 흰색으로 초기화
      if (fCtx) {
        fCtx.fillStyle = "white";
        fCtx.fillRect(0, 0, w, h);
        if (fSaved) fCtx.putImageData(fSaved, 0, 0);
      }
      if (bCtx && bSaved) bCtx.putImageData(bSaved, 0, 0);

      boundaryRef.current = null; // 리사이즈 시 캐시 무효화
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

      // 원본 SVG (흰색 fill 포함) 렌더링 → 검은 윤곽선이 boundary
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

  // ── 소리 ─────────────────────────────────────────────────────────────────
  function playPop() {
    try {
      const ac = new AudioContext();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = "sine"; o.frequency.value = 660;
      g.gain.setValueAtTime(0.1, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
      o.start(ac.currentTime); o.stop(ac.currentTime + 0.14);
    } catch { /* ignore */ }
  }

  // ── DB 저장 ───────────────────────────────────────────────────────────────
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

  // ── 채우기 (플러드 필) ────────────────────────────────────────────────────
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

    // 언두용 스냅샷 (fill 전에 저장)
    const snapshot = ctx.getImageData(0, 0, fc.width, fc.height);

    const [r, g, b] = hexToRgb(color);
    floodFill(imageData.data, fc.width, fc.height, cx, cy, r, g, b, boundary);
    ctx.putImageData(imageData, 0, 0);

    undoStack.current = [...undoStack.current.slice(-19), { canvas: "fill", snapshot }];
    setUndoCount(undoStack.current.length);
    playPop();
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
    if (e.pointerType === "touch" && hasPen.current) return; // 팜 리젝션
    e.preventDefault();
    const bc = brushCanvasRef.current;
    const ctx = bc?.getContext("2d");
    if (!bc || !ctx) return;

    // 언두 스냅샷
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
  }

  function handlePointerUp() {
    if (isDrawing.current) { isDrawing.current = false; lastPos.current = null; scheduleSave(); }
  }

  // ── 되돌리기 ────────────────────────────────────────────────────────────
  function handleUndo() {
    if (undoStack.current.length === 0) return;
    const action = undoStack.current.pop()!;
    setUndoCount(undoStack.current.length);
    const cvs = action.canvas === "fill" ? fillCanvasRef.current : brushCanvasRef.current;
    const ctx = cvs?.getContext("2d");
    if (cvs && ctx) ctx.putImageData(action.snapshot, 0, 0);
  }

  // ── 초기화 ──────────────────────────────────────────────────────────────
  function handleClear() {
    if (!window.confirm("모두 지울까요?")) return;
    undoStack.current = []; setUndoCount(0);
    const fc = fillCanvasRef.current;
    const fCtx = fc?.getContext("2d");
    if (fc && fCtx) { fCtx.fillStyle = "white"; fCtx.fillRect(0, 0, fc.width, fc.height); }
    const bc = brushCanvasRef.current;
    const bCtx = bc?.getContext("2d");
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

      // 1. fill 색상
      ctx.drawImage(fc, 0, 0);

      // 2. SVG 윤곽선
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

      // 3. 브러시 레이어
      if (bc) ctx.drawImage(bc, 0, 0);

      const a = document.createElement("a");
      a.href = off.toDataURL("image/png");
      a.download = `${title ?? "coloring"}.png`;
      a.click();
    } catch (err) {
      console.warn("저장 실패:", err);
    }
  }

  const TOOLS = [
    { id: "fill" as Tool, icon: "🪣", label: "채우기" },
    { id: "brush" as Tool, icon: "🖌️", label: "붓" },
    { id: "eraser" as Tool, icon: "🧹", label: "지우개" },
  ];

  const sliderStyle: React.CSSProperties = {
    writingMode: "vertical-lr",
    direction: "rtl",
    height: 80,
    cursor: "pointer",
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* ── 상단 바 ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {title && <h2 className="text-base font-black text-gray-700">{title}</h2>}
        <div className="flex gap-2 ml-auto flex-wrap">
          <button
            onClick={handleUndo} disabled={undoCount === 0}
            className="px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: "#EFF6FF", color: undoCount === 0 ? "#93C5FD" : "#3B82F6", border: "2px solid #BFDBFE" }}
          >↩ 되돌리기</button>
          <button onClick={handleClear} className="px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: "#FEF2F2", color: "#EF4444", border: "2px solid #FECACA" }}>
            🗑 초기화
          </button>
          <button onClick={handleSave} className="px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "white", border: "none" }}>
            💾 저장
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-start">
        {/* ── 도구 사이드바 ── */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {TOOLS.map((t) => (
            <button key={t.id} onClick={() => setTool(t.id)}
              className="flex flex-col items-center justify-center rounded-2xl transition-all"
              style={{
                width: 60, height: 60,
                background: tool === t.id ? "linear-gradient(135deg,#818CF8,#6366F1)" : "white",
                color: tool === t.id ? "white" : "#6B7280",
                border: `2px solid ${tool === t.id ? "transparent" : "#E5E7EB"}`,
                boxShadow: tool === t.id ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
              }}>
              <span className="text-2xl">{t.icon}</span>
              <span className="text-xs font-bold mt-0.5">{t.label}</span>
            </button>
          ))}

          {/* 브러시 크기 */}
          {tool !== "fill" && (
            <div className="flex flex-col items-center gap-1 rounded-2xl p-2"
              style={{ background: "white", border: "2px solid #E5E7EB" }}>
              <span className="text-xs font-bold text-gray-400">크기</span>
              <input type="range"
                min={tool === "eraser" ? 10 : 4}
                max={tool === "eraser" ? 50 : 30}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                style={sliderStyle}
              />
              <span className="text-xs text-gray-400">{brushSize}</span>
            </div>
          )}

          {/* 현재 색상 */}
          <div className="rounded-full self-center"
            style={{ width: 44, height: 44, background: color, border: "3px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          />
        </div>

        {/* ── 3-레이어 캔버스 영역 ── */}
        <div
          ref={containerRef}
          className="flex-1 relative rounded-2xl overflow-hidden"
          style={{ border: "3px solid #E5E7EB", minHeight: 300, cursor: tool === "fill" ? "crosshair" : "default", background: "white" }}
          onClick={handleContainerClick}
        >
          {/* 레이어 1: fill 캔버스 (채우기 색상) */}
          <canvas ref={fillCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1, pointerEvents: "none" }}
          />

          {/* 레이어 2: SVG 윤곽선 (fill 투명) */}
          <div className="relative w-full"
            style={{ zIndex: 2, pointerEvents: "none", lineHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: displaySvg }}
          />

          {/* 레이어 3: 브러시 캔버스 */}
          <canvas ref={brushCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              zIndex: 3,
              touchAction: "none",
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

      {/* ── 색상 팔레트 ── */}
      <div className="rounded-2xl p-3 bg-white" style={{ border: "2px solid #E5E7EB" }}>
        <p className="text-xs font-bold text-gray-400 mb-2">🎨 색상 팔레트</p>
        <div className="flex flex-wrap gap-2 items-center">
          {PALETTE.map((c, idx) => (
            <button key={`palette-${idx}`} onClick={() => setColor(c)}
              className="rounded-full transition-all"
              style={{
                width: 32, height: 32, background: c,
                border: color === c ? "3px solid #4F46E5" : "2px solid #D1D5DB",
                transform: color === c ? "scale(1.25)" : "scale(1)",
                boxShadow: color === c ? "0 0 0 2px white, 0 0 0 4px #4F46E5" : "none",
                transition: "transform 0.15s",
              }}
            />
          ))}
          <label className="rounded-full flex items-center justify-center text-gray-400 font-bold text-xl cursor-pointer"
            style={{ width: 32, height: 32, border: "2px dashed #D1D5DB", background: "white" }}>
            +
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sr-only" />
          </label>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">
        {tool === "fill"
          ? "🪣 선으로 둘러싸인 영역을 탭하면 색이 채워져요"
          : tool === "brush"
          ? "🖌️ 자유롭게 그려요 · 펜 압력 지원"
          : "🧹 지우고 싶은 곳을 문질러요"}
      </p>
    </div>
  );
}
