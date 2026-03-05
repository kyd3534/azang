import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import StoryViewer from "@/components/viewers/StoryViewer";
import PageHeader from "@/components/ui/page-header";
import type { StorySection } from "@/ai/flows/story";

export default async function StoryViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!story) notFound();

  const content = story.content as {
    version?: number;
    sections?: StorySection[];
    pages?: { pageNumber: number; text: string; imagePrompt: string }[];
    moral?: string;
  };

  // v2: sections 구조 / v1: pages 구조 (하위 호환)
  const sections: StorySection[] = content.sections ?? [];
  const legacyPages = content.pages ?? [];
  const moral = content.moral ?? "";

  return (
    <div>
      <PageHeader title="동화 보기" emoji="📖" backHref="/dashboard/story" />
      <StoryViewer
        title={story.title}
        sections={sections}
        legacyPages={legacyPages}
        moral={moral}
      />
    </div>
  );
}
