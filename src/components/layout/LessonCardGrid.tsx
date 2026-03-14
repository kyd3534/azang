"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export interface CardMeta {
  emoji: string;
  gradient: string;
  badge: string;       // 배지 배경색
  badgeText: string;   // 배지 라벨
  badgeColor: string;  // 배지 텍스트색
}

interface LessonItem {
  id: string;
  title: string;
  created_at: string;
}

interface LessonCardGridProps {
  items: LessonItem[];
  table: string;
  viewPath: string;
  emptyText: string;
  getCardMeta: (title: string) => CardMeta;
  onPractice?: (id: string) => void;
  onItemsChange?: (items: LessonItem[]) => void;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "1일 전";
  if (days < 7) return `${days}일 전`;
  if (days < 14) return "1주 전";
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}달 전`;
}

export default function LessonCardGrid({
  items,
  table,
  viewPath,
  emptyText,
  getCardMeta,
  onPractice,
  onItemsChange,
}: LessonCardGridProps) {
  const [localItems, setLocalItems] = useState(items);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    const next = localItems.filter((item) => item.id !== id);
    setLocalItems(next);
    onItemsChange?.(next);
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", id);
    setDeleting(null);
  }

  if (localItems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4 animate-bounce">🌱</p>
        <p className="text-sm font-semibold" style={{ color: "#FF85C1" }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {localItems.map((item) => {
        const meta = getCardMeta(item.title);
        return (
          <Link key={item.id} href={`${viewPath}/${item.id}`}>
            <div
              className="group relative bg-white transition-all duration-200 hover:-translate-y-1"
              style={{
                borderRadius: 20,
                border: "1.5px solid #F3F4F6",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "#F3F4F6";
              }}
            >
              {/* 썸네일 4:3 */}
              <div
                className="relative flex items-center justify-center"
                style={{ aspectRatio: "4 / 3", background: meta.gradient }}
              >
                <span style={{ fontSize: "2.8rem", lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}>
                  {meta.emoji}
                </span>

                {/* 테마 배지 */}
                <span
                  className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.85)", color: meta.badgeColor, backdropFilter: "blur(4px)" }}
                >
                  {meta.badgeText}
                </span>

                {/* 실력키우기 버튼 */}
                {onPractice && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPractice(item.id); }}
                    className="absolute bottom-2 right-2 text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                    style={{ background: "rgba(255,255,255,0.9)", color: meta.badgeColor, backdropFilter: "blur(4px)" }}
                  >
                    🏆 연습
                  </button>
                )}

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  disabled={deleting === item.id}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center hidden group-hover:flex transition-all active:scale-90"
                  style={{ background: "rgba(255,255,255,0.9)", color: "#D1D5DB", backdropFilter: "blur(4px)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#D1D5DB")}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* 하단 정보 */}
              <div className="px-3 pt-2.5 pb-3">
                <p
                  className="font-black leading-snug line-clamp-2 mb-1.5"
                  style={{ color: "#1F1F1F", fontSize: "0.82rem" }}
                >
                  {item.title}
                </p>
                <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                  {getRelativeTime(item.created_at)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
