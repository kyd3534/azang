import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import PageHeader from "@/components/ui/page-header";
import JamoViewer from "@/components/viewers/JamoViewer";
import HangulWordsViewer from "@/components/viewers/HangulWordsViewer";
import HangulSentencesViewer from "@/components/viewers/HangulSentencesViewer";
import HangulCombinedViewer from "@/components/viewers/HangulCombinedViewer";
import type { HangulOutput, HangulCombinedOutput } from "@/ai/flows/hangul";

export default async function HangulViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lesson } = await supabase
    .from("hangul_lessons")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!lesson) notFound();

  const content = lesson.characters as HangulOutput;

  return (
    <div>
      <PageHeader title={lesson.title} emoji="🌸" backHref="/dashboard/hangul" />

      {content.contentType === "hangul_combined" && (
        <HangulCombinedViewer data={content as HangulCombinedOutput} />
      )}
      {content.contentType === "jamo" && <JamoViewer data={content} />}
      {content.contentType === "words" && <HangulWordsViewer data={content} />}
      {content.contentType === "sentences" && <HangulSentencesViewer data={content} />}
    </div>
  );
}
