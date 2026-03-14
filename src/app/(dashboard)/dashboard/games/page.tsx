import Link from "next/link";
import PageHeader from "@/components/ui/page-header";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const GAMES = [
  {
    href: "/dashboard/games/memory",
    emoji: "🃏",
    label: "기억력 게임",
    desc: "카드를 뒤집어 짝을 맞춰요",
    bg: "linear-gradient(135deg, #FFD6EC 0%, #FFB3D8 100%)",
    border: "#FF9DCE",
    text: "#C2185B",
  },
  {
    href: "/dashboard/games/quiz",
    emoji: "🎯",
    label: "퀴즈 놀이",
    desc: "그림을 보고 단어를 맞혀요",
    bg: "linear-gradient(135deg, #EDD6FF 0%, #D8B3FF 100%)",
    border: "#CC88FF",
    text: "#7B1FA2",
  },
  {
    href: "/dashboard/games/maze",
    emoji: "🌀",
    label: "미로 찾기",
    desc: "🐣을 🏠까지 데려다줘요",
    bg: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)",
    border: "#6EE7B7",
    text: "#065F46",
  },
  {
    href: "/dashboard/games/drawing",
    emoji: "✏️",
    label: "따라 그리기",
    desc: "점선을 따라 그려봐요",
    bg: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
    border: "#93C5FD",
    text: "#1E40AF",
  },
  {
    href: "/dashboard/games/color-shape",
    emoji: "🎨",
    label: "색깔/모양 맞추기",
    desc: "색깔과 모양을 맞춰봐요",
    bg: "linear-gradient(135deg, #FFE8D6 0%, #FFD0AA 100%)",
    border: "#FFAA66",
    text: "#7C2D12",
  },
];

export default async function GamesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === "kyd3534@gmail.com";

  return (
    <div className="w-full">
      <PageHeader title="게임 놀이" emoji="🌈" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game) => (
          <Link key={game.href} href={game.href}>
            <div
              className="rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
              style={{
                background: game.bg,
                border: `2px solid ${game.border}`,
                boxShadow: `0 4px 16px ${game.border}44`,
              }}
            >
              <div className="text-4xl mb-3">{game.emoji}</div>
              <h2 className="font-black break-words" style={{ color: game.text }}>{game.label}</h2>
              <p className="text-xs mt-1 break-words opacity-70 font-medium" style={{ color: game.text }}>{game.desc}</p>
            </div>
          </Link>
        ))}
        {isAdmin && (
          <Link href="/dashboard/games/videos">
            <div
              className="rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
              style={{
                background: "linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)",
                border: "2px solid #7DD3FC",
                boxShadow: "0 4px 16px #7DD3FC44",
              }}
            >
              <div className="text-4xl mb-3">📺</div>
              <h2 className="font-black break-words" style={{ color: "#0369A1" }}>영상 보기</h2>
              <p className="text-xs mt-1 break-words opacity-70 font-medium" style={{ color: "#0369A1" }}>재미있는 영상을 봐요</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
