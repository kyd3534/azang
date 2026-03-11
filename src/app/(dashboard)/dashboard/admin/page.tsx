"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Trash2, Upload } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl overflow-hidden"
                style={{ border: `2px solid ${t.is_active ? "#FFD0B5" : "#E5E7EB"}`, opacity: t.is_active ? 1 : 0.5 }}>
                {templateUrls[t.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={templateUrls[t.id]} alt={t.name}
                    className="w-full aspect-square object-contain bg-gray-50 p-1" />
                )}
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
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-300">관리자 전용 페이지 · kyd3534@gmail.com</p>
    </div>
  );
}
