"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateNumberLesson } from "@/lib/ai-actions";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ContentList from "@/components/layout/ContentList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PracticeHub, { type PracticeWord } from "@/components/learning/PracticeHub";
import GenerationUsage from "@/components/ui/GenerationUsage";
import type { NumbersOutput, NumbersCombinedOutput, NamesOutput } from "@/ai/flows/numbers";

const AGE_GROUPS = [
  { value: "1-2", label: "1-2세", emoji: "🍼" },
  { value: "3-4", label: "3-4세", emoji: "🐥" },
  { value: "5-6", label: "5-6세", emoji: "🐰" },
  { value: "7-8", label: "7-8세", emoji: "🦊" },
  { value: "9-10", label: "9-10세", emoji: "🦁" },
] as const;

const AGE_DESC: Record<string, string> = {
  "1-2": "🍼 1-2세: 숫자 1~3, 이모지로 수량 시각화",
  "3-4": "🐥 3-4세: 숫자 1~5 세기 + 간단한 이야기 2개",
  "5-6": "🐰 5-6세: 숫자 1~10, 한·영 이름 + 덧셈 이야기 3개",
  "7-8": "🦊 7-8세: 숫자 1~20, 덧셈·뺄셈 이야기 4개",
  "9-10": "🦁 9-10세: 다양한 연산, 복합 이야기 문제 5개",
};

const THEME_SUGGESTIONS = [
  "동물 농장", "과일 가게", "바닷속", "우주 여행", "운동장", "생일 파티", "숲 속 친구들",
];

type AgeGroup = "1-2" | "3-4" | "5-6" | "7-8" | "9-10";
type Tab = "create" | "list" | "practice";

type Lesson = { id: string; title: string; created_at: string; numbers: unknown };

function extractWordsFromLesson(lesson: Lesson): PracticeWord[] {
  const result: PracticeWord[] = [];
  const content = lesson.numbers as NumbersOutput;
  if (content.contentType === "numbers_combined") {
    for (const n of (content as NumbersCombinedOutput).numbers) {
      result.push({ word: String(n.value), meaning: n.korean, emoji: n.emoji.substring(0, 4) });
    }
  } else if (content.contentType === "names") {
    for (const n of (content as NamesOutput).numbers) {
      result.push({ word: String(n.value), meaning: n.native, emoji: n.emoji });
    }
  }
  return result;
}

export default function NumbersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("create");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("5-6");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<{ id: string; title: string; ageGroup: AgeGroup } | null>(null);
  const [practiceWords, setPracticeWords] = useState<PracticeWord[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("number_lessons")
        .select("id, title, created_at, numbers")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setLessons(data ?? []));
    });
  }, []);

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const result = await generateNumberLesson({ ageGroup, theme: theme.trim() || undefined });
      router.push(`/dashboard/numbers/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  function handlePractice(id: string) {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;
    setPracticeWords(extractWordsFromLesson(lesson));
    const lessonAgeGroup = ((lesson.numbers as NumbersOutput).ageGroup as AgeGroup) || ageGroup;
    setSelectedLesson({ id: lesson.id, title: lesson.title, ageGroup: lessonAgeGroup });
    setTab("practice");
  }

  if (loading) return (
    <div>
      <PageHeader title="숫자 배우기" emoji="🎀" />
      <LoadingSpinner text="AI가 숫자 학습 자료를 만들고 있어요! 🔢" />
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "create", label: "✨ 만들기" },
    { key: "list", label: `📚 목록 (${lessons.length})` },
    { key: "practice", label: "🏆 실력키우기" },
  ];

  return (
    <div>
      <PageHeader title="숫자 배우기" emoji="🎀" />

      {/* 탭 */}
      <div className="flex gap-1 rounded-2xl p-1 mb-6" style={{ background: "#FFF3C8" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap px-1"
            style={tab === t.key
              ? { background: "white", color: "#F57F17", boxShadow: "0 2px 8px rgba(255,180,30,0.2)" }
              : { color: "#FFA000" }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 만들기 ── */}
      {tab === "create" && (
        <div className="max-w-lg space-y-6">
          <GenerationUsage />
          <div className="space-y-2">
            <Label className="font-bold text-amber-700">아이 연령대</Label>
            <div className="grid grid-cols-5 gap-2">
              {AGE_GROUPS.map((g) => (
                <button key={g.value} onClick={() => setAgeGroup(g.value)}
                  className="rounded-2xl py-3 text-center transition-all"
                  style={ageGroup === g.value
                    ? { background: "linear-gradient(135deg,#FFD740,#FF8F00)", color: "white", border: "2px solid transparent", boxShadow: "0 4px 14px rgba(255,180,30,0.35)" }
                    : { background: "white", color: "#FFA000", border: "2px solid #FFF3C8" }
                  }>
                  <div className="text-lg mb-0.5">{g.emoji}</div>
                  <div className="text-xs font-bold">{g.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme" className="font-bold text-amber-700">
              이야기 테마 <span className="font-normal text-amber-400 text-xs">(선택)</span>
            </Label>
            <Input id="theme"
              placeholder="예: 동물 농장, 과일 가게, 우주 여행"
              value={theme} onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="border-amber-200 focus:border-amber-400 rounded-xl" />
            <div className="flex flex-wrap gap-2">
              {THEME_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setTheme(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold hover:opacity-80"
                  style={{ background: "#FFF3C8", color: "#F57F17" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 text-xs text-amber-600"
            style={{ background: "#FFFBEB", border: "1px solid #FFF3C8" }}>
            {AGE_DESC[ageGroup]}
          </div>

          {error && <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <Button onClick={handleGenerate} className="w-full rounded-xl font-black text-base py-5"
            style={{ background: "linear-gradient(90deg,#FFD740,#FF8F00)", border: "none", color: "white" }} size="lg">
            AI로 학습 자료 만들기 🎀✨
          </Button>
        </div>
      )}

      {/* ── 목록 ── */}
      {tab === "list" && (
        <ContentList
          items={lessons}
          table="number_lessons"
          viewPath="/dashboard/numbers"
          emptyText="아직 만든 숫자 학습이 없어요! 🎀"
          onPractice={handlePractice}
        />
      )}

      {/* ── 실력키우기 ── */}
      {tab === "practice" && (
        <div className="max-w-lg">
          {selectedLesson ? (
            <div>
              <div className="mb-5 rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ background: "#F5F3FF", border: "2px solid #EDE9FE" }}>
                <span className="text-2xl">📚</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "#818CF8" }}>현재 학습 중인 자료</p>
                  <p className="font-black text-sm truncate" style={{ color: "#4338CA" }}>{selectedLesson.title}</p>
                </div>
                <button
                  onClick={() => setTab("list")}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-bold hover:opacity-80"
                  style={{ background: "#EDE9FE", color: "#4338CA" }}
                >
                  바꾸기 →
                </button>
              </div>
              <PracticeHub words={practiceWords} defaultAgeGroup={selectedLesson.ageGroup} subject="numbers" />
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-5xl mb-4 animate-bounce">🏆</p>
              <p className="text-base font-black mb-2" style={{ color: "#4338CA" }}>
                실력키우기 할 학습을 선택해주세요!
              </p>
              <p className="text-sm text-gray-400 mb-6">
                목록에서 원하는 학습 자료의 <span className="font-bold" style={{ color: "#4338CA" }}>🏆 실력키우기</span> 버튼을 눌러요
              </p>
              <button
                onClick={() => setTab("list")}
                className="px-6 py-2.5 rounded-2xl font-black text-sm"
                style={{ background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "white" }}
              >
                목록 보러 가기 📚
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
