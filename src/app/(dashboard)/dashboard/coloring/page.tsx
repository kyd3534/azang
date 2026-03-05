"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateColoringPage } from "@/lib/ai-actions";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { PRESET_CHARACTERS } from "@/components/coloring/presetCharacters";

const SUGGESTIONS = [
  "귀여운 강아지", "우주선", "꽃밭과 나비", "공룡", "바닷속 물고기",
  "케이크", "자동차", "고양이", "무지개", "성",
];

type Tab = "characters" | "create" | "list";

export default function ColoringListPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("characters");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pages, setPages] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("coloring_pages")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setPages(data ?? []));
    });
  }, []);

  async function handleGenerate() {
    if (!subject.trim()) { setError("주제를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await generateColoringPage({ subject });
      router.push(`/dashboard/coloring/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("coloring_pages").delete().eq("id", id);
    setPages((p) => p.filter((x) => x.id !== id));
  }

  if (loading) return (
    <div>
      <PageHeader title="색칠하기" emoji="🦋" />
      <LoadingSpinner text="AI가 색칠 도안을 그리고 있어요! 🎨" />
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "characters", label: "🐾 캐릭터" },
    { key: "create", label: "✨ AI 만들기" },
    { key: "list", label: `📚 내 도안 (${pages.length})` },
  ];

  return (
    <div>
      <PageHeader title="색칠하기" emoji="🦋" />

      {/* 탭 */}
      <div className="flex gap-1 rounded-2xl p-1 mb-6" style={{ background: "#FFE8D6" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap px-1"
            style={tab === t.key
              ? { background: "white", color: "#E65100", boxShadow: "0 2px 8px rgba(255,140,50,0.2)" }
              : { color: "#FF8A50" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 캐릭터 탭 ── */}
      {tab === "characters" && (
        <div>
          <p className="text-sm text-gray-400 mb-4">
            귀여운 캐릭터를 골라 색칠해보세요! 🎨 진행 상황이 자동 저장돼요.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {PRESET_CHARACTERS.map((char) => (
              <Link
                key={char.id}
                href={`/dashboard/coloring/character/${char.id}`}
                className="group rounded-2xl bg-white overflow-hidden transition-all hover:-translate-y-1"
                style={{ border: "2px solid #FFE8D6", boxShadow: "0 4px 16px rgba(255,140,50,0.12)" }}
              >
                {/* Mini SVG preview */}
                <div
                  className="w-full aspect-[4/5] overflow-hidden flex items-center justify-center p-2"
                  style={{ background: "#FFFBF5" }}
                  dangerouslySetInnerHTML={{ __html: char.svg.replace(/style="[^"]*"/, 'style="width:100%;height:100%;display:block"') }}
                />
                <div className="px-3 pb-3 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{char.emoji}</span>
                    <div>
                      <p className="font-black text-sm" style={{ color: "#E65100" }}>{char.label}</p>
                      <p className="text-xs text-gray-400">{char.description}</p>
                    </div>
                  </div>
                  <div
                    className="mt-2 w-full py-1.5 rounded-xl text-xs font-bold text-center transition-all group-hover:opacity-90"
                    style={{ background: "linear-gradient(90deg,#FF8A50,#FF5722)", color: "white" }}
                  >
                    색칠하기 🖌️
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── AI 만들기 탭 ── */}
      {tab === "create" && (
        <div className="max-w-lg space-y-6">
          <div className="rounded-xl px-4 py-3 text-sm font-medium"
            style={{ background: "#FFF8F5", border: "1px solid #FFE8D6", color: "#E65100" }}>
            🤖 AI가 주제에 맞는 색칠 도안을 직접 그려드려요!
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject" className="font-bold text-orange-700">색칠할 주제</Label>
            <Input
              id="subject"
              placeholder="무엇을 그릴까요?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="border-orange-200 focus:border-orange-400 rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold hover:opacity-80 transition-opacity"
                  style={{ background: "#FFE8D6", color: "#E65100" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <Button
            onClick={handleGenerate}
            className="w-full rounded-xl font-black text-base py-5"
            style={{ background: "linear-gradient(90deg, #FF8A50, #FF5722)", border: "none" }}
            size="lg"
          >
            도안 만들기 🦋✨
          </Button>
        </div>
      )}

      {/* ── 내 도안 탭 ── */}
      {tab === "list" && (
        <div className="space-y-3">
          {pages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4 animate-bounce">🖌️</p>
              <p className="text-sm font-semibold" style={{ color: "#FF8A50" }}>
                아직 AI로 만든 도안이 없어요!
              </p>
              <button
                onClick={() => setTab("create")}
                className="mt-3 text-xs px-4 py-2 rounded-full font-bold"
                style={{ background: "#FFE8D6", color: "#E65100" }}
              >
                AI 도안 만들기 →
              </button>
            </div>
          ) : (
            pages.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between px-4 py-3"
                style={{ border: "2px solid #FFE8D6", boxShadow: "0 3px 12px rgba(255,140,50,0.12)" }}
              >
                <Link href={`/dashboard/coloring/${p.id}`} className="flex-1 min-w-0">
                  <p className="font-bold break-words truncate" style={{ color: "#E65100" }}>{p.title}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "#FF8A50" }}>
                    {isMounted ? new Date(p.created_at).toLocaleDateString("ko-KR") : ""}
                  </p>
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="ml-3 p-2 rounded-xl transition-colors hover:bg-red-50"
                  style={{ color: "#FFB3AA" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#FFB3AA")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
