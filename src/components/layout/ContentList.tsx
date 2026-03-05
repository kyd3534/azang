"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface ContentItem {
  id: string;
  title: string;
  created_at: string;
}

interface ContentListProps {
  items: ContentItem[];
  table: string;
  viewPath: string;
  emptyText: string;
  onPractice?: (id: string) => void;
}

export default function ContentList({ items, table, viewPath, emptyText, onPractice }: ContentListProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  if (typeof window !== "undefined" && !isMounted) {
    setIsMounted(true);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", id);
    router.refresh();
    setDeleting(null);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4 animate-bounce">🌱</p>
        <p className="text-sm font-semibold" style={{ color: "#FF85C1" }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl bg-white hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 p-4"
          style={{
            border: "2px solid #FFD6EC",
            boxShadow: "0 3px 12px rgba(255,105,180,0.12)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#FF9DCE";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(255,105,180,0.22)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "#FFD6EC";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 3px 12px rgba(255,105,180,0.12)";
          }}
        >
          <Link href={`${viewPath}/${item.id}`} className="flex-1 min-w-0">
            <p className="font-bold break-words truncate" style={{ color: "#C2185B" }}>{item.title}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#FF85C1" }}>
              {isMounted ? new Date(item.created_at).toLocaleDateString("ko-KR") : ""}
            </p>
          </Link>

          {onPractice && (
            <button
              onClick={(e) => { e.preventDefault(); onPractice(item.id); }}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 active:scale-95"
              style={{ background: "#EDE9FE", color: "#4338CA", border: "1.5px solid #C4B5FD" }}
            >
              🏆 실력키우기
            </button>
          )}

          <button
            onClick={() => handleDelete(item.id)}
            disabled={deleting === item.id}
            className="flex-shrink-0 p-2 rounded-xl transition-colors hover:bg-red-50"
            style={{ color: "#FFB3D8" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#FFB3D8")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
