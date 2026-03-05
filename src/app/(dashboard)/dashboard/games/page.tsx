import Link from "next/link";
import PageHeader from "@/components/ui/page-header";

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
    href: "/dashboard/games/counting",
    emoji: "🌟",
    label: "숫자 세기",
    desc: "화면의 물건을 세어봐요",
    bg: "linear-gradient(135deg, #FFF3C8 0%, #FFE599 100%)",
    border: "#FFD740",
    text: "#F57F17",
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

export default function GamesPage() {
  return (
    <div>
      <PageHeader title="게임 놀이" emoji="🌈" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl">
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
      </div>
    </div>
  );
}
