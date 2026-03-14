"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateHangulLesson } from "@/lib/ai-actions";
import { createClient } from "@/lib/supabase";
import PageHeader from "@/components/ui/page-header";
import LoadingSpinner from "@/components/ui/loading-spinner";
import LessonCardGrid, { type CardMeta } from "@/components/layout/LessonCardGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PracticeHub, { type PracticeWord } from "@/components/learning/PracticeHub";
import GenerationUsage from "@/components/ui/GenerationUsage";
import type { HangulOutput, HangulCombinedOutput } from "@/ai/flows/hangul";

const AGE_GROUPS = [
  { value: "1-2", label: "1-2세", emoji: "🍼" },
  { value: "3-4", label: "3-4세", emoji: "🐥" },
  { value: "5-6", label: "5-6세", emoji: "🐰" },
  { value: "7-8", label: "7-8세", emoji: "🦊" },
  { value: "9-10", label: "9-10세", emoji: "🦁" },
] as const;

const AGE_DESC: Record<string, string> = {
  "1-2": "🍼 1-2세: 소리·이미지 연결, 글자 3개 (초간단 예문)",
  "3-4": "🐥 3-4세: 기초 단어 4개 + 짧은 이야기 3-4줄",
  "5-6": "🐰 5-6세: 단어 5개 + 음절 색깔 구분 + 이야기 5-6줄",
  "7-8": "🦊 7-8세: 단어 6개 + 읽기 지문 8-10줄 + 이해 질문 2개",
  "9-10": "🦁 9-10세: 단어 8개 + 긴 지문 + 이해 질문 3개",
};

const TOPIC_SUGGESTIONS = [
  "동물", "음식", "가족", "집 안", "학교", "자연", "탈것", "날씨", "감정", "계절",
];

type AgeGroup = "1-2" | "3-4" | "5-6" | "7-8" | "9-10";
type Tab = "create" | "list" | "practice";

type Lesson = { id: string; title: string; created_at: string; characters: unknown };

const HANGUL_CARD_META: Array<{ keywords: string[]; emoji: string; gradient: string; badgeText: string; badgeColor: string }> = [
  { keywords: ["동물", "강아지", "고양이", "토끼", "곰", "호랑이", "사자", "코끼리"], emoji: "🐶", gradient: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)", badgeText: "동물", badgeColor: "#065F46" },
  { keywords: ["음식", "밥", "빵", "국수", "떡", "과자", "간식", "요리", "먹거리"], emoji: "🍱", gradient: "linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)", badgeText: "음식", badgeColor: "#9A3412" },
  { keywords: ["가족", "엄마", "아빠", "할머니", "할아버지", "언니", "오빠", "동생", "형"], emoji: "👨‍👩‍👧", gradient: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)", badgeText: "가족", badgeColor: "#9D174D" },
  { keywords: ["집", "방", "거실", "주방", "화장실", "침실", "부엌"], emoji: "🏠", gradient: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)", badgeText: "집", badgeColor: "#1E40AF" },
  { keywords: ["학교", "교실", "선생님", "공부", "칠판", "책상", "연필", "지우개"], emoji: "✏️", gradient: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)", badgeText: "학교", badgeColor: "#4338CA" },
  { keywords: ["자연", "숲", "나무", "꽃", "풀", "산", "강", "들판", "바람"], emoji: "🌿", gradient: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)", badgeText: "자연", badgeColor: "#166534" },
  { keywords: ["탈것", "자동차", "버스", "기차", "비행기", "배", "자전거", "오토바이"], emoji: "🚗", gradient: "linear-gradient(135deg, #DBEAFE 0%, #BAE6FD 100%)", badgeText: "탈것", badgeColor: "#075985" },
  { keywords: ["날씨", "비", "눈", "햇살", "구름", "바람", "태풍", "무지개", "천둥"], emoji: "⛅", gradient: "linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)", badgeText: "날씨", badgeColor: "#713F12" },
  { keywords: ["감정", "기쁨", "슬픔", "화남", "놀람", "행복", "무서움", "사랑", "기분"], emoji: "😊", gradient: "linear-gradient(135deg, #FDF2F8 0%, #FBCFE8 100%)", badgeText: "감정", badgeColor: "#BE185D" },
  { keywords: ["계절", "봄", "여름", "가을", "겨울", "꽃", "단풍", "눈사람"], emoji: "🍂", gradient: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", badgeText: "계절", badgeColor: "#92400E" },
];

function getHangulCardMeta(title: string): CardMeta {
  const lower = title.toLowerCase();
  for (const m of HANGUL_CARD_META) {
    if (m.keywords.some((k) => lower.includes(k))) {
      return { emoji: m.emoji, gradient: m.gradient, badge: "white", badgeText: m.badgeText, badgeColor: m.badgeColor };
    }
  }
  return { emoji: "🌸", gradient: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)", badge: "white", badgeText: "한글", badgeColor: "#065F46" };
}

function extractWordsFromLesson(lesson: Lesson): PracticeWord[] {
  const result: PracticeWord[] = [];
  const content = lesson.characters as HangulOutput;
  if (content.contentType === "hangul_combined") {
    for (const item of (content as HangulCombinedOutput).items) {
      result.push({ word: item.char, meaning: item.meaning, emoji: item.emoji });
    }
  } else if (content.contentType === "words") {
    for (const w of content.words) {
      result.push({ word: w.word, meaning: w.meaning, emoji: w.emoji });
    }
  }
  return result;
}

export default function HangulPage() {
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("hangul_lessons")
        .select("id, title, created_at, characters")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setLessons(data ?? []));
    });
  }, []);

  async function handleGenerate() {
    if (!topic.trim()) { setError("주제를 입력해주세요."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await generateHangulLesson({ ageGroup, topic });
      router.push(`/dashboard/hangul/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  function handlePractice(id: string) {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;
    setPracticeWords(extractWordsFromLesson(lesson));
    const lessonAgeGroup = ((lesson.characters as HangulOutput).ageGroup as AgeGroup) || ageGroup;
    setSelectedLesson({ id: lesson.id, title: lesson.title, ageGroup: lessonAgeGroup });
    setTab("practice");
  }

  if (loading) return (
    <div>
      <PageHeader title="한글 배우기" emoji="🌸" />
      <LoadingSpinner text="AI가 한글 학습 자료를 만들고 있어요! 📝" />
    </div>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "create", label: "✨ 만들기" },
    { key: "list", label: `📚 목록 (${lessons.length})` },
    { key: "practice", label: "🏆 실력키우기" },
  ];

  return (
    <div>
      <PageHeader title="한글 배우기" emoji="🌸" />

      {/* 탭 */}
      <div className="flex gap-1 rounded-2xl p-1 mb-6" style={{ background: "#D6F5EE" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap px-1"
            style={tab === t.key
              ? { background: "white", color: "#1B5E20", boxShadow: "0 2px 8px rgba(34,180,100,0.2)" }
              : { color: "#4CAF50" }
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
            <Label className="font-bold text-emerald-700">아이 연령대</Label>
            <div className="grid grid-cols-5 gap-2">
              {AGE_GROUPS.map((g) => (
                <button key={g.value} onClick={() => setAgeGroup(g.value)}
                  className="rounded-2xl py-3 text-center transition-all"
                  style={ageGroup === g.value
                    ? { background: "linear-gradient(135deg,#4CAF50,#2E7D32)", color: "white", border: "2px solid transparent", boxShadow: "0 4px 14px rgba(34,180,100,0.35)" }
                    : { background: "white", color: "#4CAF50", border: "2px solid #D6F5EE" }
                  }>
                  <div className="text-lg mb-0.5">{g.emoji}</div>
                  <div className="text-xs font-bold">{g.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic" className="font-bold text-emerald-700">주제</Label>
            <Input id="topic"
              placeholder="예: 동물, 음식, 학교"
              value={topic} onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="border-green-200 focus:border-green-400 rounded-xl" />
            <div className="flex flex-wrap gap-2">
              {TOPIC_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setTopic(s)}
                  className="text-xs px-3 py-1.5 rounded-full font-semibold hover:opacity-80"
                  style={{ background: "#D6F5EE", color: "#1B5E20" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl px-4 py-3 text-xs text-emerald-600"
            style={{ background: "#F0FDF4", border: "1px solid #D6F5EE" }}>
            {AGE_DESC[ageGroup]}
          </div>

          {error && <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <Button onClick={handleGenerate} className="w-full rounded-xl font-black text-base py-5"
            style={{ background: "linear-gradient(90deg,#4CAF50,#2E7D32)", border: "none" }} size="lg">
            AI로 학습 자료 만들기 🌸✨
          </Button>
        </div>
      )}

      {/* ── 목록 ── */}
      {tab === "list" && (
        <LessonCardGrid
          items={lessons}
          table="hangul_lessons"
          viewPath="/dashboard/hangul"
          emptyText="아직 만든 한글 학습이 없어요! 🌸"
          getCardMeta={getHangulCardMeta}
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
              <PracticeHub words={practiceWords} defaultAgeGroup={selectedLesson.ageGroup} subject="hangul" />
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
