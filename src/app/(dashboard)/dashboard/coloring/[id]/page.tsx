import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ColoringStudio from "@/components/coloring/ColoringStudio";
import PageHeader from "@/components/ui/page-header";

export default async function ColoringViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: page } = await supabase
    .from("coloring_pages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!page) notFound();

  const { data: strokeData } = await supabase
    .from("coloring_strokes")
    .select("strokes")
    .eq("page_id", id)
    .single();

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 88px)" }}>
      <div className="flex-shrink-0">
        <PageHeader title={page.title} emoji="🎨" backHref="/dashboard/coloring" />
      </div>
      <div className="flex-1 min-h-0 pb-1">
        <ColoringStudio
          pageId={id}
          svgContent={page.svg_content}
          title={page.title}
          initialFills={(strokeData?.strokes as Record<string, string>) ?? {}}
          persistToDb={true}
        />
      </div>
    </div>
  );
}
