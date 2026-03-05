"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateStory } from "@/lib/ai-actions";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ContentList from "@/components/layout/ContentList";
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

export default function StoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "list">("create");
  const [theme, setTheme] = useState("");
  const [ageGroup, setAgeGroup] = useState<"1-2" | "3-4" | "5-6" | "7-8" | "9-10">("5-6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stories, setStories] = useState<{ id: string; title: string; created_at: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("stories").select("id, title, created_at").eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setStories(data ?? []));
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
        {[{ key: "create", label: "만들기" }, { key: "list", label: `내 동화 (${stories.length})` }].map((t) => (
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
          {/* 연령 선택 */}
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

          {/* 주제 입력 */}
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
        <ContentList items={stories} table="stories" viewPath="/dashboard/story" emptyText="아직 만든 동화가 없어요. 첫 동화를 만들어봐요! 🦄" />
      )}
    </div>
  );
}
