export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      {/* 핑크 스피너 */}
      <div
        className="w-14 h-14 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin"
      />
      <p className="text-sm font-bold" style={{ color: "#EC4899" }}>
        불러오는 중...
      </p>
    </div>
  );
}
