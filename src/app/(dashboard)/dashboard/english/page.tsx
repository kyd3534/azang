"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateEnglishLesson } from "@/lib/ai-actions";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import ContentList from "@/components/layout/ContentList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PracticeHub, { type PracticeWord } from "@/components/learning/PracticeHub";
import GenerationUsage from "@/components/ui/GenerationUsage";
import type { EnglishOutput, CombinedOutput } from "@/ai/flows/english";

const AGE_GROUPS = [
  { value: "1-2", label: "1-2세", emoji: "🍼" },
  { value: "3-4", label: "3-4세", emoji: "🐥" },
  { value: "5-6", label: "5-6세", emoji: "🐰" },
  { value: "7-8", label: "7-8세", emoji: "🦊" },
  { value: "9-10", label: "9-10세", emoji: "🦁" },
] as const;

const TOPIC_SUGGESTIONS = [
  "동물", "과일", "채소", "색깔", "음식",
  "학교에서", "가족과 함께", "친구 만나기", "공원에서", "생일 파티",
];

type AgeGroup = "1-2" | "3-4" | "5-6" | "7-8" | "9-10";
type Tab = "create" | "list" | "practice";

type Lesson = { id: string; title: string; created_at: string; words: unknown };

function extractWordsFromLesson(lesson: Lesson): PracticeWord[] {
  const result: PracticeWord[] = [];
  const content = lesson.words as EnglishOutput;
  if (content.contentType === "combined") {
    for (const w of (content as CombinedOutput).words) {
      result.push({ word: w.word, meaning: w.meaning, emoji: w.emoji, pronunciation: w.pronunciation });
    }
  } else if (content.contentType === "words") {
    for (const w of content.words) {
      result.push({ word: w.word, meaning: w.meaning, emoji: w.emoji, pronunciation: w.pronunciation });
    }
  } else if (content.contentType === "dialogue") {
    for (const v of content.vocabulary) {
      result.push({ word: v.word, meaning: v.meaning, emoji: "💬" });
    }
  }
  return result;
}

export default function EnglishPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("create");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("5-6");
  const [topic, setTopic] = useState("");
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
        .from("english_lessons")
        .select("id, title, created_at, words")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setLessons(data ?? []));
    });
  }, []);

  async function handleGenerate() {
    if (!topic.trim()) { setError("주제를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await generateEnglishLesson({ ageGroup, topic });
      router.push(`/dashboard/english/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  function handlePractice(id: string) {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;
    setPracticeWords(extractWordsFromLesson(lesson));
    const lessonAgeGroup = ((lesson.words as EnglishOutput).ageGroup as AgeGroup) || ageGroup;
    setSelectedLesson({ id: lesson.id, title: lesson.title, ageGroup: lessonAgeGroup });
    setTab("practice");
  }

  if (loading) return (
    <div>
      <PageHeader title="영어 배우기" emoji="⭐" />
      <LoadingSpinner text="AI가 영어 학습 자료를 만들고 있어요! ✨" />
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "create", label: "✨ 만들기" },
    { key: "list", label: `📚 목록 (${lessons.length})` },
    { key: "practice", label: "🏆 실력키우기" },
  ];

  return (
    <div>
      <PageHeader title="영어 배우기" emoji="⭐" />

      {/* 탭 */}
      <div className="flex gap-1 rounded-2xl p-1 mb-6" style={{ background: "#EDE9FE" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap px-1"
            style={
              tab === t.key
                ? { background: "white", color: "#4338CA", boxShadow: "0 2px 8px rgba(99,102,241,0.2)" }
                : { color: "#818CF8" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 만들기 ── */}
      {tab === "create" && (
        <div className="max-w-lg space-y-6">
          <GenerationUsage />
          <div className="space-y-2">
            <Label className="font-bold text-indigo-600">아이 연령대</Label>
            <div className="grid grid-cols-5 gap-2">
              {AGE_GROUPS.map((g) => (
                <button key={g.value} onClick={() => setAgeGroup(g.value)}
                  className="rounded-2xl py-3 text-center transition-all"
                  style={ageGroup === g.value
                    ? { background: "linear-gradient(135deg,#818CF8,#6366F1)", color: "white", border: "2px solid transparent", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }
                    : { background: "white", color: "#818CF8", border: "2px solid #EDE9FE" }
                  }>
                  <div className="text-lg mb-0.5">{g.emoji}</div>
                  <div className="text-xs font-bold">{g.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic" className="font-bold text-indigo-600">주제</Label>
            <Input id="topic"
              placeholder="예: 동물, 학교에서, 가족과 함께"
              value={topic} onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="border-indigo-200 focus:border-indigo-400 rounded-xl" />
            <div className="flex flex-wrap gap-2">
              {TOPIC_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setTopic(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold hover:opacity-80"
                  style={{ background: "#EDE9FE", color: "#4338CA" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 text-xs text-indigo-500"
            style={{ background: "#F5F3FF", border: "1px solid #EDE9FE" }}>
            {ageGroup === "1-2" && "🍼 1-2세: 아주 간단한 단어 3개 (동물, 색깔 등 기초)"}
            {ageGroup === "3-4" && "🐥 3-4세: 쉬운 단어 4개 + 짧은 대화 4줄"}
            {ageGroup === "5-6" && "🐰 5-6세: 단어 5개 + 자연스러운 대화 6줄"}
            {ageGroup === "7-8" && "🦊 7-8세: 단어 7개 + 풍부한 대화 8줄"}
            {ageGroup === "9-10" && "🦁 9-10세: 단어 10개 + 긴 대화 10줄"}
          </div>

          {error && <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <Button onClick={handleGenerate} className="w-full rounded-xl font-black text-base py-5"
            style={{ background: "linear-gradient(90deg,#818CF8,#6366F1)", border: "none" }} size="lg">
            AI로 학습 자료 만들기 ✨
          </Button>
        </div>
      )}

      {/* ── 목록 ── */}
      {tab === "list" && (
        <ContentList
          items={lessons}
          table="english_lessons"
          viewPath="/dashboard/english"
          emptyText="아직 만든 영어 학습이 없어요! ⭐"
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
              <PracticeHub words={practiceWords} defaultAgeGroup={selectedLesson.ageGroup} subject="english" />
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
