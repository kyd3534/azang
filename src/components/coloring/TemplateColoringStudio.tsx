"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { playFillSound, playBrushSound, playEraserSound } from "@/lib/coloring-sound";

const PALETTE: readonly string[] = [
  "#FFB3C1", "#B3D9FF", "#B3FFD9", "#D9B3FF", "#FFCBA4", "#FFFAB3",
  "#FFD6E0", "#C8F0FF",
  "#FF3366", "#FF8C00", "#FFD700", "#00CC44", "#0066FF", "#9933FF",
  "#FF0099", "#00CCFF",
  "#FFFFFF", "#E0E0E0", "#A0A0A0", "#6B7280",
  "#A0522D", "#4A2F1A", "#000000", "#FDBCB4",
] as const;

type Tool = "fill" | "brush" | "eraser";

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

function floodFill(
  data: Uint8ClampedArray, width: number, height: number,
  sx: number, sy: number, fillR: number, fillG: number, fillB: number,
  boundaryData: Uint8ClampedArray | null, tolerance = 35,
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
    data[i] = fillR; data[i + 1] = fillG; data[i + 2] = fillB; data[i + 3] = 255;
    if (x > 0 && !visited[pos - 1] && matches(pos - 1)) { visited[pos - 1] = 1; queue[tail++] = pos - 1; }
    if (x < width - 1 && !visited[pos + 1] && matches(pos + 1)) { visited[pos + 1] = 1; queue[tail++] = pos + 1; }
    if (y > 0 && !visited[pos - width] && matches(pos - width)) { visited[pos - width] = 1; queue[tail++] = pos - width; }
    if (y < height - 1 && !visited[pos + width] && matches(pos + width)) { visited[pos + width] = 1; queue[tail++] = pos + width; }
  }
}

export interface TemplateColoringStudioProps {
  imageUrl: string;
  pageId: string;
  title?: string;
  persistToDb?: boolean;
}

export default function TemplateColoringStudio({
  imageUrl, pageId, title, persistToDb = true,
}: TemplateColoringStudioProps) {
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#FFB3C1");
  const [brushSize, setBrushSize] = useState(15);
  const [undoCount, setUndoCount] = useState(0);
  const [corsOk, setCorsOk] = useState<boolean | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fillCanvasRef = useRef<HTMLCanvasElement>(null);
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);

  type UndoEntry = { canvas: "fill" | "brush"; snapshot: ImageData };
  const undoStack = useRef<UndoEntry[]>([]);
  const boundaryRef = useRef<Uint8ClampedArray | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasPen = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();

  // 캔버스 크기 → 컨테이너 동기화
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
      if (fCtx && fc!.width > 0) try { fSaved = fCtx.getImageData(0, 0, fc!.width, fc!.height); } catch { /**/ }
      const bCtx = bc!.getContext("2d");
      let bSaved: ImageData | null = null;
      if (bCtx && bc!.width > 0) try { bSaved = bCtx.getImageData(0, 0, bc!.width, bc!.height); } catch { /**/ }

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

  // 이미지 CORS 로드 → 경계 픽셀 데이터
  async function getBoundary(): Promise<Uint8ClampedArray | null> {
    if (boundaryRef.current) return boundaryRef.current;
    if (corsOk === false) return null;
    const fc = fillCanvasRef.current;
    if (!fc || fc.width <= 0) return null;

    try {
      const tmp = document.createElement("canvas");
      tmp.width = fc.width; tmp.height = fc.height;
      const ctx = tmp.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, tmp.width, tmp.height);

      const ok = await new Promise<boolean>((res) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { ctx.drawImage(img, 0, 0, tmp.width, tmp.height); res(true); };
        img.onerror = () => res(false);
        img.src = imageUrl + "?t=" + Date.now(); // cache bust for CORS
      });

      if (!ok) { setCorsOk(false); return null; }
      setCorsOk(true);
      boundaryRef.current = ctx.getImageData(0, 0, tmp.width, tmp.height).data;
      return boundaryRef.current;
    } catch {
      setCorsOk(false);
      return null;
    }
  }

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
          strokes: { v: 2, fill: fc.toDataURL(), brush: bc?.toDataURL() ?? null },
        });
      } catch { /**/ }
    }, 800);
  }

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
    if (isDrawing.current) { isDrawing.current = false; lastPos.current = null; scheduleSave(); }
  }

  function handleUndo() {
    if (undoStack.current.length === 0) return;
    const action = undoStack.current.pop()!;
    setUndoCount(undoStack.current.length);
    const cvs = action.canvas === "fill" ? fillCanvasRef.current : brushCanvasRef.current;
    const ctx = cvs?.getContext("2d");
    if (cvs && ctx) ctx.putImageData(action.snapshot, 0, 0);
  }

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

  async function handleSave() {
    const fc = fillCanvasRef.current;
    const bc = brushCanvasRef.current;
    if (!fc) return;
    try {
      const off = document.createElement("canvas");
      off.width = fc.width; off.height = fc.height;
      const ctx = off.getContext("2d")!;
      ctx.drawImage(fc, 0, 0);
      await new Promise<void>((res) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { ctx.drawImage(img, 0, 0, off.width, off.height); res(); };
        img.onerror = () => res();
        img.src = imageUrl;
      });
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
    { id: "brush" as Tool, icon: "🖌️", label: "붓" },
    { id: "eraser" as Tool, icon: "🧹", label: "지우개" },
    { id: "fill" as Tool, icon: "🪣", label: "채우기" },
  ];

  const sliderStyle: React.CSSProperties = {
    writingMode: "vertical-lr", direction: "rtl", height: 80, cursor: "pointer",
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* 상단 바 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2 ml-auto flex-wrap">
          <button onClick={handleUndo} disabled={undoCount === 0}
            className="px-3 py-2 rounded-xl text-sm font-bold"
            style={{ background: "#EFF6FF", color: undoCount === 0 ? "#93C5FD" : "#3B82F6", border: "2px solid #BFDBFE" }}>
            ↩ 되돌리기
          </button>
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
        {/* 도구 사이드바 */}
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

          {tool !== "fill" && (
            <div className="flex flex-col items-center gap-1 rounded-2xl p-2"
              style={{ background: "white", border: "2px solid #E5E7EB" }}>
              <span className="text-xs font-bold text-gray-400">크기</span>
              <input type="range"
                min={tool === "eraser" ? 10 : 4} max={tool === "eraser" ? 50 : 30}
                value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))}
                style={sliderStyle}
              />
              <span className="text-xs text-gray-400">{brushSize}</span>
            </div>
          )}

          <div className="rounded-full self-center"
            style={{ width: 44, height: 44, background: color, border: "3px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          />
        </div>

        {/* 3-레이어 캔버스 영역 */}
        {/*
          레이어 구조:
          z1: fill canvas (채우기 색상, 흰 배경)
          z2: brush canvas (자유 브러시)
          z3: 스케치 이미지 (mix-blend-mode: multiply → 흰 부분 투명, 검은 선만 보임)
        */}
        <div
          ref={containerRef}
          className="flex-1 relative rounded-2xl overflow-hidden"
          style={{
            border: "3px solid #E5E7EB",
            cursor: tool === "fill" ? "crosshair" : "default",
            background: "white",
            isolation: "isolate",
          }}
          onClick={handleContainerClick}
        >
          {/* 높이 기준 이미지 (투명, 레이아웃용) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            aria-hidden
            className="block w-full h-auto"
            style={{ visibility: "hidden" }}
          />

          {/* z1: fill 캔버스 */}
          <canvas ref={fillCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1, pointerEvents: "none" }}
          />

          {/* z2: brush 캔버스 */}
          <canvas ref={brushCanvasRef}
            className="absolute inset-0 w-full h-full"
            style={{
              zIndex: 2,
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

          {/* z3: 스케치 이미지 오버레이 (검은 선만 보임) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="색칠 도안"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ zIndex: 3, pointerEvents: "none", mixBlendMode: "multiply" }}
          />
        </div>
      </div>

      {/* 색상 팔레트 */}
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
          ? corsOk === false
            ? "🖌️ 이 도안은 붓 모드로 색칠해요"
            : "🪣 선으로 둘러싸인 영역을 탭하면 색이 채워져요"
          : tool === "brush"
          ? "🖌️ 자유롭게 그려요 · 펜 압력 지원"
          : "🧹 지우고 싶은 곳을 문질러요"}
      </p>
    </div>
  );
}
