import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import TemplateColoringStudio from "@/components/coloring/TemplateColoringStudio";

export default async function TemplateColoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: template } = await supabase
    .from("coloring_templates")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!template) notFound();

  // Public URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from("coloring_templates")
    .getPublicUrl(template.storage_path);

  // 저장된 진행 상황 불러오기
  const pageId = user ? `template_${id}_${user.id}` : `template_${id}`;
  let hasSaved = false;

  if (user) {
    const { data } = await supabase
      .from("coloring_strokes")
      .select("page_id")
      .eq("page_id", pageId)
      .single();
    hasSaved = !!data;
  }

  return (
    <div>
      <div className="mb-4">
        <a
          href="/dashboard/coloring"
          className="inline-flex items-center gap-1 text-sm font-semibold hover:opacity-80 transition-opacity"
          style={{ color: "#3B82F6" }}
        >
          ‹ 돌아가기
        </a>
      </div>
      {hasSaved && (
        <p className="text-xs text-green-600 mb-4 font-semibold">
          ✅ 저장된 색칠이 있어요 — 이어서 칠해요!
        </p>
      )}
      <TemplateColoringStudio
        imageUrl={publicUrl}
        pageId={pageId}
        title={template.name}
        persistToDb={!!user}
      />
    </div>
  );
}
