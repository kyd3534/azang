import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import InteractiveCharacter from "@/components/ui/interactive-3d-character";

const MENU_ITEMS = [
  {
    href: "/dashboard/story",
    emoji: "🦄",
    label: "동화 만들기",
    desc: "AI가 나만의 동화를 써줘요",
    bg: "linear-gradient(135deg, #FFD6EC 0%, #FFB3D8 100%)",
    border: "#FF9DCE",
    text: "#C2185B",
  },
  {
    href: "/dashboard/english",
    emoji: "⭐",
    label: "영어 배우기",
    desc: "재미있는 영단어 학습",
    bg: "linear-gradient(135deg, #EDD6FF 0%, #D8B3FF 100%)",
    border: "#CC88FF",
    text: "#7B1FA2",
  },
  {
    href: "/dashboard/hangul",
    emoji: "🌸",
    label: "한글 배우기",
    desc: "한글 자모를 익혀요",
    bg: "linear-gradient(135deg, #D6F5EE 0%, #B3EDD8 100%)",
    border: "#88DDB3",
    text: "#1B5E20",
  },
  {
    href: "/dashboard/numbers",
    emoji: "🎀",
    label: "숫자 배우기",
    desc: "숫자와 친해져요",
    bg: "linear-gradient(135deg, #FFF3C8 0%, #FFE599 100%)",
    border: "#FFD740",
    text: "#F57F17",
  },
  {
    href: "/dashboard/coloring",
    emoji: "🦋",
    label: "색칠하기",
    desc: "AI 도안에 색을 칠해요",
    bg: "linear-gradient(135deg, #FFE8D6 0%, #FFD0AA 100%)",
    border: "#FFAA66",
    text: "#E65100",
  },
  {
    href: "/dashboard/games",
    emoji: "🌈",
    label: "게임 놀이",
    desc: "미니 게임으로 학습해요",
    bg: "linear-gradient(135deg, #D6EEFF 0%, #B3D8FF 100%)",
    border: "#88BBFF",
    text: "#1565C0",
  },
];

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: stories }, { data: lessons }] = await Promise.all([
    supabase.from("stories").select("id").eq("user_id", user!.id),
    supabase.from("english_lessons").select("id").eq("user_id", user!.id),
  ]);

  return (
    <div className="bg-white">

      {/* ── 그리팅 카드 ── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-5"
        style={{ boxShadow: "0 4px 20px rgba(59,130,246,0.10), 0 0 0 1px rgba(59,130,246,0.07)", isolation: "isolate" }}
      >
        {/* 오로라 블롭 */}
        <div className="aurora-background">
          <div className="aurora-blob" />
          <div className="aurora-blob" />
          <div className="aurora-blob" />
          <div className="aurora-blob" />
        </div>

        <div className="relative z-10 p-5 sm:p-8">
          {/* 텍스트 + 뱃지 */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl sm:text-4xl animate-bounce">🌟</span>
                <h1 className="text-xl sm:text-2xl font-black" style={{ color: "#1E40AF" }}>
                  오늘도 함께 배워요!
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "#DBEAFE", color: "#1E40AF" }}
                >
                  동화 {stories?.length ?? 0}편 🎉
                </span>
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "#EDE9FE", color: "#4338CA" }}
                >
                  학습 {lessons?.length ?? 0}개 ✨
                </span>
              </div>
            </div>
          </div>

          {/* 장식 이모지 + 3D 캐릭터: 중앙 정렬 */}
          <div className="flex flex-col items-center">
            <div className="text-2xl space-x-3 mb-1 select-none">
              {["🌸", "⭐", "🌷", "💖", "🌟"].map((e, i) => (
                <span
                  key={e}
                  className="animate-bounce inline-block"
                  style={{ animationDelay: `${i * 200}ms` }}
                >
                  {e}
                </span>
              ))}
            </div>
            <div style={{ width: 230, height: 230 }}>
              <div className="hero-container" style={{ width: "100%", height: "100%" }}>
                <div className="character-container" style={{ width: "100%", height: "100%" }}>
                  <InteractiveCharacter />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 메뉴 섹션 ── */}
      <h2 className="text-sm font-black mb-3" style={{ color: "#94A3B8" }}>
        무엇을 배울까요? 🎈
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {MENU_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className="rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 active:scale-95 hover:-translate-y-0.5 break-words"
              style={{
                background: item.bg,
                border: `2px solid ${item.border}`,
                boxShadow: `0 4px 14px ${item.border}44`,
              }}
            >
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{item.emoji}</div>
              <h2 className="font-black text-sm break-words" style={{ color: item.text }}>
                {item.label}
              </h2>
              <p className="text-xs mt-1 break-words opacity-70 font-medium" style={{ color: item.text }}>
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
