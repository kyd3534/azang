"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f59e0b",
  "#ffffff", "#d1d5db", "#6b7280", "#374151", "#000000",
];

interface InteractiveColoringSVGProps {
  pageId: string;
  svgContent: string;
  initialStrokes?: Record<string, string>;
}

export default function InteractiveColoringSVG({
  pageId, svgContent, initialStrokes = {},
}: InteractiveColoringSVGProps) {
  const [selectedColor, setSelectedColor] = useState("#ef4444");
  const [strokes, setStrokes] = useState<Record<string, string>>(initialStrokes);
  const supabase = createClient();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFill = useCallback((elementId: string) => {
    const newStrokes = { ...strokes, [elementId]: selectedColor };
    setStrokes(newStrokes);

    // Non-blocking 저장 (디바운스 500ms)
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase.from("coloring_strokes").upsert({ page_id: pageId, strokes: newStrokes });
    }, 500);
  }, [selectedColor, strokes, pageId, supabase]);

  // SVG에 색상 적용
  const coloredSvg = svgContent.replace(
    /<(path|circle|rect|ellipse|polygon|polyline)([^>]*?)(\s*\/>|>)/g,
    (match, tag, attrs, close) => {
      const idMatch = attrs.match(/id="([^"]+)"/);
      const id = idMatch?.[1];
      if (!id) {
        // id 없는 요소에 자동 id 부여는 복잡하므로 클릭 시 처리
        return match;
      }
      const fill = strokes[id] ?? null;
      if (!fill) return match;
      const newAttrs = attrs.replace(/fill="[^"]*"/, `fill="${fill}"`);
      return `<${tag}${newAttrs === attrs ? attrs + ` fill="${fill}"` : newAttrs}${close}`;
    }
  );

  function handleSvgClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as SVGElement;
    const tagName = target.tagName.toLowerCase();
    if (!["path", "circle", "rect", "ellipse", "polygon", "polyline"].includes(tagName)) return;

    let id = target.getAttribute("id");
    if (!id) {
      // id 없으면 동적 부여
      id = `el-${Math.random().toString(36).slice(2, 8)}`;
      target.setAttribute("id", id);
    }
    target.setAttribute("fill", selectedColor);

    const newStrokes = { ...strokes, [id]: selectedColor };
    setStrokes(newStrokes);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase.from("coloring_strokes").upsert({ page_id: pageId, strokes: newStrokes });
    }, 500);
  }

  function handleReset() {
    setStrokes({});
    supabase.from("coloring_strokes").upsert({ page_id: pageId, strokes: {} });
  }

  return (
    <div className="space-y-4">
      {/* 색상 팔레트 */}
      <div className="rounded-xl bg-white shadow-notion p-4">
        <p className="text-xs text-gray-400 mb-3">색상 선택</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                selectedColor === color ? "border-gray-800 scale-125" : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: selectedColor }} />
          <span className="text-xs text-gray-500">선택된 색상</span>
          <button onClick={handleReset}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
            초기화
          </button>
        </div>
      </div>

      {/* SVG 캔버스 */}
      <div
        className="rounded-xl bg-white shadow-notion p-4 cursor-crosshair"
        onClick={handleSvgClick}
        dangerouslySetInnerHTML={{ __html: coloredSvg }}
      />

      <p className="text-xs text-center text-gray-400">영역을 탭하면 색칠돼요 🎨</p>
    </div>
  );
}
