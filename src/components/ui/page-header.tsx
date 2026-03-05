import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  emoji: string;
  backHref?: string;
}

export default function PageHeader({ title, emoji, backHref = "/dashboard" }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity mb-3"
        style={{ color: "#3B82F6" }}
      >
        <ChevronLeft className="w-4 h-4" />
        돌아가기
      </Link>
      <h1 className="text-2xl font-black flex items-center gap-2">
        <span className="text-3xl">{emoji}</span>
        <span
          style={{
            background: "linear-gradient(90deg, #3B82F6, #6366F1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </span>
        <span className="text-lg animate-twinkle">✨</span>
      </h1>
    </div>
  );
}
