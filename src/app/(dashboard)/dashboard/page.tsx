import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import FairyCharacter from "@/components/ui/fairy-character-client";

const MENU_ITEMS = [
  {
    href: "/dashboard/story",
    label: "동화",
    bg: "linear-gradient(145deg, #FFB3D4, #FF7BAC)",
    shadow: "rgba(255,100,160,0.4)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* 책 */}
        <rect x="8" y="10" width="14" height="28" rx="2" fill="white" fillOpacity="0.95"/>
        <rect x="26" y="10" width="14" height="28" rx="2" fill="white" fillOpacity="0.85"/>
        <rect x="21" y="9" width="6" height="30" rx="1" fill="white" fillOpacity="0.5"/>
        {/* 책 내용 선 */}
        <line x1="11" y1="16" x2="19" y2="16" stroke="#FF7BAC" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="11" y1="20" x2="19" y2="20" stroke="#FF7BAC" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="11" y1="24" x2="19" y2="24" stroke="#FF7BAC" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="11" y1="28" x2="16" y2="28" stroke="#FF7BAC" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="29" y1="16" x2="37" y2="16" stroke="#FF7BAC" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="29" y1="20" x2="37" y2="20" stroke="#FF7BAC" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="29" y1="24" x2="37" y2="24" stroke="#FF7BAC" strokeWidth="1.8" strokeLinecap="round"/>
        {/* 별 */}
        <path d="M38 6 l1.5 3.2 3.5.5-2.5 2.4.6 3.4L38 14l-3.1 1.5.6-3.4-2.5-2.4 3.5-.5z" fill="#FFD700"/>
        <circle cx="12" cy="7" r="1.5" fill="white" fillOpacity="0.8"/>
        <circle cx="7" cy="12" r="1" fill="white" fillOpacity="0.6"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/english",
    label: "영어",
    bg: "linear-gradient(145deg, #C4B5FD, #8B5CF6)",
    shadow: "rgba(139,92,246,0.4)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* A */}
        <text x="5" y="32" fill="white" fontSize="22" fontWeight="900" fontFamily="Arial Black, Arial" fillOpacity="0.95">A</text>
        {/* B */}
        <text x="18" y="26" fill="white" fontSize="17" fontWeight="900" fontFamily="Arial Black, Arial" fillOpacity="0.8">B</text>
        {/* C */}
        <text x="30" y="38" fill="white" fontSize="14" fontWeight="900" fontFamily="Arial Black, Arial" fillOpacity="0.7">C</text>
        {/* 반짝이 */}
        <path d="M40 8 l1.2 2.5 2.8.4-2 1.9.5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-1.9 2.8-.4z" fill="#FFD700"/>
        <circle cx="8" cy="8" r="2" fill="white" fillOpacity="0.5"/>
        <circle cx="42" cy="28" r="1.5" fill="white" fillOpacity="0.4"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/hangul",
    label: "한글",
    bg: "linear-gradient(145deg, #6EE7B7, #10B981)",
    shadow: "rgba(16,185,129,0.4)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* 가 */}
        <text x="4" y="32" fill="white" fontSize="22" fontWeight="900" fontFamily="sans-serif" fillOpacity="0.95">가</text>
        {/* 나 */}
        <text x="22" y="24" fill="white" fontSize="15" fontWeight="900" fontFamily="sans-serif" fillOpacity="0.8">나</text>
        {/* 다 */}
        <text x="30" y="40" fill="white" fontSize="13" fontWeight="900" fontFamily="sans-serif" fillOpacity="0.7">다</text>
        {/* 장식 */}
        <circle cx="42" cy="10" r="4" fill="white" fillOpacity="0.3"/>
        <circle cx="8" cy="42" r="2.5" fill="white" fillOpacity="0.25"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/numbers",
    label: "숫자",
    bg: "linear-gradient(145deg, #FDE68A, #F59E0B)",
    shadow: "rgba(245,158,11,0.4)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* 1 */}
        <text x="4" y="30" fill="white" fontSize="24" fontWeight="900" fontFamily="Arial Black, Arial" fillOpacity="0.95">1</text>
        {/* 2 */}
        <text x="18" y="24" fill="white" fontSize="18" fontWeight="900" fontFamily="Arial Black, Arial" fillOpacity="0.85">2</text>
        {/* 3 */}
        <text x="32" y="38" fill="white" fontSize="15" fontWeight="900" fontFamily="Arial Black, Arial" fillOpacity="0.75">3</text>
        {/* 별/장식 */}
        <path d="M40 7 l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" fill="white" fillOpacity="0.9"/>
        <circle cx="9" cy="42" r="2" fill="white" fillOpacity="0.4"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/coloring",
    label: "색칠",
    bg: "linear-gradient(145deg, #FDC89A, #F97316)",
    shadow: "rgba(249,115,22,0.4)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* 크레용 몸통 */}
        <rect x="20" y="8" width="10" height="26" rx="3" fill="white" fillOpacity="0.95"/>
        <rect x="20" y="8" width="10" height="8" rx="3" fill="#FFD700" fillOpacity="0.9"/>
        {/* 크레용 끝 뾰족 */}
        <path d="M20 34 L25 42 L30 34Z" fill="white" fillOpacity="0.9"/>
        {/* 색 점들 */}
        <circle cx="10" cy="14" r="5" fill="#FF5BA3" fillOpacity="0.9"/>
        <circle cx="38" cy="14" r="5" fill="#60A5FA" fillOpacity="0.9"/>
        <circle cx="10" cy="34" r="5" fill="#34D399" fillOpacity="0.9"/>
        <circle cx="38" cy="34" r="5" fill="#A78BFA" fillOpacity="0.9"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/games",
    label: "게임",
    bg: "linear-gradient(145deg, #93C5FD, #3B82F6)",
    shadow: "rgba(59,130,246,0.4)",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* 게임패드 본체 */}
        <rect x="6" y="15" width="36" height="20" rx="10" fill="white" fillOpacity="0.92"/>
        {/* 왼쪽 십자키 */}
        <rect x="13" y="21" width="3" height="8" rx="1.5" fill="#3B82F6"/>
        <rect x="10" y="24" width="9" height="3" rx="1.5" fill="#3B82F6"/>
        {/* 오른쪽 버튼들 */}
        <circle cx="32" cy="22" r="2.5" fill="#FF5BA3"/>
        <circle cx="37" cy="26" r="2.5" fill="#FFD700"/>
        <circle cx="27" cy="26" r="2.5" fill="#34D399"/>
        <circle cx="32" cy="30" r="2.5" fill="#A78BFA"/>
        {/* 상단 돌기 */}
        <rect x="14" y="11" width="6" height="6" rx="3" fill="white" fillOpacity="0.7"/>
        <rect x="28" y="11" width="6" height="6" rx="3" fill="white" fillOpacity="0.7"/>
      </svg>
    ),
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
                  몽글이와 함께 배워요!
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

          {/* 요정 캐릭터 + 꾸미기 */}
          <div className="flex flex-col items-center w-full mt-2">
            <FairyCharacter />
          </div>
        </div>
      </div>

      {/* ── 메뉴 섹션 ── */}
      <h2 className="text-sm font-black mb-3" style={{ color: "#94A3B8" }}>
        무엇을 배울까요? 🎈
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {MENU_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className="rounded-2xl cursor-pointer transition-all duration-200 active:scale-95 hover:-translate-y-1 flex flex-col items-center justify-center gap-2 py-4 px-2"
              style={{
                background: item.bg,
                boxShadow: `0 6px 20px ${item.shadow}`,
              }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16">
                {item.icon}
              </div>
              <span className="font-black text-sm text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
