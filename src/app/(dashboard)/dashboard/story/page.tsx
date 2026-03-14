"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { generateStory } from "@/lib/ai-actions";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GenerationUsage from "@/components/ui/GenerationUsage";

const AGE_GROUPS = [
  { value: "1-2", label: "1-2세", emoji: "🍼" },
  { value: "3-4", label: "3-4세", emoji: "🐥" },
  { value: "5-6", label: "5-6세", emoji: "🐰" },
  { value: "7-8", label: "7-8세", emoji: "🦊" },
  { value: "9-10", label: "9-10세", emoji: "🦁" },
] as const;

const THEME_SUGGESTIONS = ["토끼와 거북이", "우주 여행", "바닷속 탐험", "마법의 숲", "공룡 친구들"];

type StoryTheme = "모험" | "마법" | "우정" | "자연" | "동물" | "우주" | "바다" | "노래";

const THEME_META: Record<StoryTheme, { emoji: string; gradient: string; badge: string }> = {
  모험: { emoji: "🦕", gradient: "linear-gradient(135deg, #FFD6EC 0%, #E8C8FF 100%)", badge: "#F3E8FF" },
  마법: { emoji: "🌲", gradient: "linear-gradient(135deg, #C8E8FF 0%, #D6F4FF 100%)", badge: "#E0F2FE" },
  우정: { emoji: "🐢", gradient: "linear-gradient(135deg, #C8F4D8 0%, #D6FFE8 100%)", badge: "#DCFCE7" },
  자연: { emoji: "🌸", gradient: "linear-gradient(135deg, #FFF3C8 0%, #FFECD6 100%)", badge: "#FEF9C3" },
  동물: { emoji: "🦁", gradient: "linear-gradient(135deg, #FFE0C8 0%, #FFDDE8 100%)", badge: "#FEE2E2" },
  우주: { emoji: "⭐", gradient: "linear-gradient(135deg, #E0D6FF 0%, #C8D8FF 100%)", badge: "#EDE9FE" },
  바다: { emoji: "🐠", gradient: "linear-gradient(135deg, #C8F0FF 0%, #D6E8FF 100%)", badge: "#E0F7FF" },
  노래: { emoji: "🎵", gradient: "linear-gradient(135deg, #FFE8C8 0%, #FFF3D6 100%)", badge: "#FEF3C7" },
};

const FALLBACK_META = { emoji: "📖", gradient: "linear-gradient(135deg, #FFD6EC 0%, #E8C8FF 100%)", badge: "#F3E8FF" };

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

interface StoryCard {
  id: string;
  title: string;
  created_at: string;
  storyTheme?: StoryTheme;
  pageCount?: number;
}

export default function StoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "list">("create");
  const [theme, setTheme] = useState("");
  const [ageGroup, setAgeGroup] = useState<"1-2" | "3-4" | "5-6" | "7-8" | "9-10">("5-6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("stories")
        .select("id, title, created_at, content")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setStories(
            (data ?? []).map((row) => ({
              id: row.id,
              title: row.title,
              created_at: row.created_at,
              storyTheme: row.content?.storyTheme as StoryTheme | undefined,
              pageCount: row.content?.pageCount as number | undefined,
            }))
          );
        });
    });
  }, []);

  async function handleGenerate() {
    if (!theme.trim()) { setError("주제를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await generateStory({ theme, ageGroup });
      router.push(`/dashboard/story/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    const supabase = createClient();
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) window.location.reload();
    setDeleting(null);
  }

  if (loading) return (
    <div>
      <PageHeader title="동화 만들기" emoji="🦄" />
      <LoadingSpinner text="AI가 동화를 쓰고 있어요... ✨" />
    </div>
  );

  return (
    <div>
      <PageHeader title="동화 만들기" emoji="🦄" />

      {/* 탭 */}
      <div className="flex gap-1 rounded-2xl p-1 mb-6 max-w-xs" style={{ background: "#FFD6EC" }}>
        {[
          { key: "create", label: "만들기" },
          { key: "list", label: `내 동화 (${stories.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as "create" | "list")}
            className="flex-1 py-2 text-sm font-bold rounded-xl transition-all"
            style={tab === t.key
              ? { background: "white", color: "#FF4FAD", boxShadow: "0 2px 8px rgba(255,105,180,0.2)" }
              : { color: "#FF85C1" }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "create" ? (
        <div className="max-w-lg space-y-6">
          <GenerationUsage />
          <div className="space-y-2">
            <Label className="font-bold text-pink-600">아이 연령대</Label>
            <div className="grid grid-cols-5 gap-2">
              {AGE_GROUPS.map((g) => (
                <button key={g.value} onClick={() => setAgeGroup(g.value)}
                  className="rounded-2xl py-3 text-center transition-all duration-200"
                  style={ageGroup === g.value
                    ? { background: "linear-gradient(135deg, #FF6BB5, #C778E8)", color: "white", border: "2px solid transparent", boxShadow: "0 4px 14px rgba(255,105,180,0.35)" }
                    : { background: "white", color: "#FF85C1", border: "2px solid #FFD6EC" }
                  }>
                  <div className="text-lg mb-0.5">{g.emoji}</div>
                  <div className="text-xs font-bold">{g.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme" className="font-bold text-pink-600">동화 주제</Label>
            <Input id="theme" placeholder="어떤 동화를 만들까요?"
              value={theme} onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="border-pink-200 focus:border-pink-400 rounded-xl"
            />
            <div className="flex flex-wrap gap-2">
              {THEME_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setTheme(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold transition-colors hover:opacity-80"
                  style={{ background: "#FFD6EC", color: "#C2185B" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          <Button onClick={handleGenerate} className="w-full rounded-xl font-black text-base py-5"
            style={{ background: "linear-gradient(90deg, #FF6BB5, #C778E8)", border: "none" }} size="lg">
            동화 만들기 🦄✨
          </Button>
        </div>
      ) : (
        stories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4 animate-bounce">🌱</p>
            <p className="text-sm font-semibold" style={{ color: "#FF85C1" }}>
              아직 만든 동화가 없어요. 첫 동화를 만들어봐요! 🦄
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stories.map((story) => {
              const meta = story.storyTheme ? THEME_META[story.storyTheme] : FALLBACK_META;
              return (
                <Link key={story.id} href={`/dashboard/story/${story.id}`}>
                  <div
                    className="group relative bg-white transition-all duration-200 hover:-translate-y-1"
                    style={{
                      borderRadius: 20,
                      border: "1.5px solid #FFD6EC",
                      boxShadow: "0 2px 12px rgba(255,105,180,0.1)",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(255,105,180,0.22)";
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#FFB3D8";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(255,105,180,0.1)";
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#FFD6EC";
                    }}
                  >
                    {/* 썸네일 — 4:3 */}
                    <div
                      className="relative flex items-center justify-center"
                      style={{ aspectRatio: "4 / 3", background: meta.gradient }}
                    >
                      <span style={{ fontSize: "2.8rem", lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}>
                        {meta.emoji}
                      </span>

                      {/* 테마 배지 */}
                      {story.storyTheme && (
                        <span
                          className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.85)", color: "#BE185D", backdropFilter: "blur(4px)" }}
                        >
                          {story.storyTheme}
                        </span>
                      )}

                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => handleDelete(story.id, e)}
                        disabled={deleting === story.id}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center hidden group-hover:flex transition-all active:scale-90"
                        style={{ background: "rgba(255,255,255,0.9)", color: "#FFB3D8", backdropFilter: "blur(4px)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#FFB3D8")}
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
                        {story.title}
                      </p>
                      <div className="flex items-center gap-2">
                        {story.pageCount && (
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: meta.badge, color: "#BE185D" }}
                          >
                            📚 {story.pageCount}쪽
                          </span>
                        )}
                        <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                          • {getRelativeTime(story.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
