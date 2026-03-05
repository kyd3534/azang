export default function LoadingSpinner({ text = "생성 중..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      {/* 핑크 링 애니메이션 */}
      <div className="relative w-20 h-20">
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ background: "linear-gradient(135deg, #FF85C1, #C778E8)" }}
        />
        <div
          className="absolute inset-2 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "linear-gradient(135deg, #FF6BB5, #C778E8)" }}
        >
          ✨
        </div>
      </div>

      {/* 바운싱 도트 */}
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full animate-bounce" style={{ background: "#FF85C1", animationDelay: "0ms" }} />
        <div className="w-3 h-3 rounded-full animate-bounce" style={{ background: "#C778E8", animationDelay: "150ms" }} />
        <div className="w-3 h-3 rounded-full animate-bounce" style={{ background: "#FF6BB5", animationDelay: "300ms" }} />
      </div>

      <p className="font-bold text-sm" style={{ color: "#FF85C1" }}>{text}</p>
    </div>
  );
}
