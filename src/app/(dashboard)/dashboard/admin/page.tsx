"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Trash2, Upload, Video, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

type ColoringTemplate = {
  id: string;
  name: string;
  category: string;
  storage_path: string;
  sort_order: number;
  is_active: boolean;
};

export default function AdminPage() {
  const [templates, setTemplates] = useState<ColoringTemplate[]>([]);
  const [templateUrls, setTemplateUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COLS = 3; // sm:grid-cols-3 기준 첫 줄 개수
  const visibleTemplates = expanded ? templates : templates.slice(0, COLS);

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    const supabase = createClient();
    const { data } = await supabase
      .from("coloring_templates")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!data) return;
    setTemplates(data);
    const urls: Record<string, string> = {};
    data.forEach((t) => {
      const { data: { publicUrl } } = supabase.storage
        .from("coloring_templates")
        .getPublicUrl(t.storage_path);
      urls[t.id] = publicUrl;
    });
    setTemplateUrls(urls);
  }

  async function handleUpload() {
    const files = Array.from(fileInputRef.current?.files ?? []);
    if (files.length === 0) { setUploadMsg("파일을 선택해주세요."); return; }

    setUploading(true);
    setUploadMsg(`0 / ${files.length} 업로드 중...`);

    const supabase = createClient();
    let baseOrder = templates.length > 0 ? Math.max(...templates.map(t => t.sort_order)) + 1 : 0;
    let success = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        const nameToUse = file.name.replace(/\.[^.]+$/, "");
        const ext = file.name.split(".").pop() ?? "png";
        const path = `${Date.now()}_${nameToUse.replace(/\s+/g, "_")}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("coloring_templates")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("coloring_templates").insert({
          name: nameToUse,
          category: "general",
          storage_path: path,
          sort_order: baseOrder++,
          is_active: true,
        });
        if (dbError) throw dbError;

        success++;
        setUploadMsg(`${success} / ${files.length} 업로드 중...`);
      } catch (e) {
        errors.push(file.name + ": " + (e instanceof Error ? e.message : String(e)));
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    await loadTemplates();

    setUploadMsg(errors.length === 0
      ? `✅ ${success}개 업로드 완료!`
      : `✅ ${success}개 완료, ❌ 실패: ${errors.join(" / ")}`);
    setUploading(false);
  }

  async function handleDeleteTemplate(t: ColoringTemplate) {
    if (!window.confirm(`"${t.name}" 도안을 삭제할까요?`)) return;
    const supabase = createClient();
    await supabase.storage.from("coloring_templates").remove([t.storage_path]);
    await supabase.from("coloring_templates").delete().eq("id", t.id);
    await loadTemplates();
  }

  async function toggleTemplateActive(t: ColoringTemplate) {
    const supabase = createClient();
    await supabase.from("coloring_templates").update({ is_active: !t.is_active }).eq("id", t.id);
    await loadTemplates();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === templates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(templates.map((t) => t.id)));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`선택한 ${selectedIds.size}개 도안을 삭제할까요?`)) return;
    setBulkDeleting(true);
    const supabase = createClient();
    const toDelete = templates.filter((t) => selectedIds.has(t.id));
    const paths = toDelete.map((t) => t.storage_path);
    await supabase.storage.from("coloring_templates").remove(paths);
    await supabase.from("coloring_templates").delete().in("id", [...selectedIds]);
    setSelectedIds(new Set());
    setBulkDeleting(false);
    await loadTemplates();
  }

  const activeCount = templates.filter(t => t.is_active).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#1E40AF" }}>🛡️ 관리자 패널</h1>
      </div>

      {/* 색칠 도안 관리 */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #FFE8D6", boxShadow: "0 4px 24px rgba(255,140,50,0.08)" }}
      >
        {/* 헤더 + 개수 */}
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg" style={{ color: "#E65100" }}>🖼️ 색칠 도안 관리</h2>
          <div className="flex gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#D1FAE5", color: "#059669" }}>
              공개 {activeCount}개
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#F3F4F6", color: "#6B7280" }}>
              전체 {templates.length}개
            </span>
          </div>
        </div>

        {/* 업로드 */}
        <div className="space-y-3 rounded-xl p-4" style={{ background: "#FFFBF5", border: "1.5px solid #FFE8D6" }}>
          <p className="text-sm font-bold" style={{ color: "#E65100" }}>새 도안 업로드</p>
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="flex-1 text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:cursor-pointer"
            />
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0"
              style={{ background: uploading ? "#E5E7EB" : "linear-gradient(90deg,#FF8A50,#FF5722)", color: uploading ? "#9CA3AF" : "white", border: "none" }}
            >
              <Upload size={14} />
              {uploading ? "업로드 중..." : "업로드"}
            </button>
          </div>
          {uploadMsg && (
            <p className="text-sm font-semibold" style={{ color: uploadMsg.startsWith("✅") ? "#059669" : "#DC2626" }}>
              {uploadMsg}
            </p>
          )}
        </div>

        {/* 도안 목록 */}
        {templates.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">업로드된 도안이 없어요</p>
        ) : (
          <div className="space-y-3">
            {/* 다중 선택 툴바 */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedIds.size === templates.length && templates.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-orange-500"
                />
                <span className="text-xs font-bold" style={{ color: "#6B7280" }}>
                  전체 선택 ({selectedIds.size}/{templates.length})
                </span>
              </label>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{ background: "#FEE2E2", color: "#DC2626" }}
                >
                  <Trash2 size={12} />
                  {bulkDeleting ? "삭제 중..." : `${selectedIds.size}개 삭제`}
                </button>
              )}
            </div>

            {/* 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleTemplates.map((t) => {
                const isSelected = selectedIds.has(t.id);
                return (
                  <div
                    key={t.id}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      border: `2px solid ${isSelected ? "#F97316" : t.is_active ? "#FFD0B5" : "#E5E7EB"}`,
                      opacity: t.is_active ? 1 : 0.5,
                      boxShadow: isSelected ? "0 0 0 3px rgba(249,115,22,0.2)" : "none",
                    }}
                  >
                    {/* 썸네일 + 체크박스 */}
                    <div className="relative">
                      {templateUrls[t.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={templateUrls[t.id]} alt={t.name}
                          className="w-full aspect-square object-contain bg-gray-50 p-1" />
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(t.id)}
                        className="absolute top-1.5 left-1.5 w-4 h-4 rounded accent-orange-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="px-2 py-1.5 space-y-1" style={{ background: "#FFFBF5" }}>
                      <p className="text-xs font-bold truncate" style={{ color: "#E65100" }}>{t.name}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleTemplateActive(t)}
                          className="flex-1 text-xs py-1 rounded-lg font-bold"
                          style={{ background: t.is_active ? "#D1FAE5" : "#FEF3C7", color: t.is_active ? "#059669" : "#D97706" }}
                        >
                          {t.is_active ? "공개" : "숨김"}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(t)}
                          className="p-1 rounded-lg hover:bg-red-50"
                          style={{ color: "#EF4444" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 펼치기 / 접기 버튼 */}
            {templates.length > COLS && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: "#FFF3E8", color: "#E65100", border: "1.5px dashed #FFD0B5" }}
              >
                {expanded ? (
                  <><ChevronUp size={14} /> 접기</>
                ) : (
                  <><ChevronDown size={14} /> 더 보기 ({templates.length - COLS}개 더)</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 영상 관리 링크 */}
      <Link href="/dashboard/admin/videos">
        <div
          className="rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all hover:-translate-y-0.5"
          style={{ background: "white", border: "2px solid #BFDBFE", boxShadow: "0 4px 24px rgba(14,165,233,0.08)" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #E0F2FE, #BAE6FD)" }}
          >
            <Video size={22} style={{ color: "#0369A1" }} />
          </div>
          <div>
            <p className="font-black" style={{ color: "#0369A1" }}>📺 영상 관리</p>
            <p className="text-xs text-gray-400 mt-0.5">NAS 연결 설정 및 영상 목록 관리</p>
          </div>
        </div>
      </Link>

      <p className="text-xs text-center text-gray-300">관리자 전용 페이지 · kyd3534@gmail.com</p>
    </div>
  );
}
