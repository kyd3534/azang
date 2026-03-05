"use client";

import { useEffect, useState, useTransition } from "react";
import { getPendingUsers, approveUser, rejectUser } from "@/lib/admin-actions";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type User = {
  id: string;
  nickname: string | null;
  email: string | null;
  status: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "대기 중",  color: "#D97706", bg: "#FEF3C7" },
  approved: { label: "승인됨",   color: "#065F46", bg: "#D1FAE5" },
  rejected: { label: "거절됨",   color: "#991B1B", bg: "#FEE2E2" },
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  async function load() {
    setLoading(true);
    const data = await getPendingUsers();
    setUsers(data as User[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleApprove(id: string) {
    startTransition(async () => {
      await approveUser(id);
      await load();
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      await rejectUser(id);
      await load();
    });
  }

  const filtered = filter === "all" ? users : users.filter(u => u.status === filter);
  const pendingCount = users.filter(u => u.status === "pending").length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#1E40AF" }}>
          🛡️ 관리자 패널
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          가입 신청을 승인하거나 거절하세요
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        {(["pending", "approved", "rejected"] as const).map((s) => {
          const meta = STATUS_LABEL[s];
          const count = users.filter(u => u.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="rounded-2xl p-4 text-center transition-all"
              style={{
                background: filter === s ? meta.bg : "white",
                border: `2px solid ${filter === s ? meta.color : "#E5E7EB"}`,
              }}
            >
              <p className="text-2xl font-black" style={{ color: meta.color }}>{count}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      <div
        className="rounded-2xl p-6 space-y-3"
        style={{ background: "white", border: "2px solid #DBEAFE", boxShadow: "0 4px 24px rgba(59,130,246,0.08)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-black" style={{ color: "#1E40AF" }}>
            {filter === "all" ? "전체 회원" : STATUS_LABEL[filter].label}
            {pendingCount > 0 && filter !== "approved" && filter !== "rejected" && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#FEF3C7", color: "#D97706" }}>
                {pendingCount}명 대기
              </span>
            )}
          </h2>
          <button onClick={() => setFilter("all")} className="text-xs text-gray-400 underline">전체 보기</button>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">해당 회원이 없어요</p>
        ) : (
          filtered.map((u) => {
            const meta = STATUS_LABEL[u.status ?? "pending"] ?? STATUS_LABEL.pending;
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl p-4"
                style={{ border: "1.5px solid #E5E7EB", background: "#FAFAFF" }}
              >
                {/* 아바타 */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #EC4899, #C026D3)" }}
                >
                  {(u.nickname ?? u.email ?? "?").charAt(0).toUpperCase()}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{u.nickname ?? "(닉네임 없음)"}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email ?? "(이메일 없음)"}</p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(u.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>

                {/* 상태 배지 */}
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>

                {/* 승인/거절 버튼 (대기 중일 때만) */}
                {u.status === "pending" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleApprove(u.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
                      style={{ color: "#059669" }}
                      title="승인"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => handleReject(u.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: "#DC2626" }}
                      title="거절"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                )}

                {/* 승인됨 — 다시 거절 가능 */}
                {u.status === "approved" && (
                  <button
                    onClick={() => handleReject(u.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50 shrink-0"
                    style={{ color: "#DC2626" }}
                    title="거절로 변경"
                  >
                    <XCircle size={18} />
                  </button>
                )}

                {/* 거절됨 — 다시 승인 가능 */}
                {u.status === "rejected" && (
                  <button
                    onClick={() => handleApprove(u.id)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg transition-colors hover:bg-green-50 shrink-0"
                    style={{ color: "#059669" }}
                    title="승인으로 변경"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-center text-gray-300">관리자 전용 페이지 · kyd3534@gmail.com</p>
    </div>
  );
}
