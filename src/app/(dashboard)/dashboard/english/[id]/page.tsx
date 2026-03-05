import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import PageHeader from "@/components/ui/page-header";
import LessonViewer from "@/components/viewers/LessonViewer";
import DialogueViewer from "@/components/viewers/DialogueViewer";
import SentencesViewer from "@/components/viewers/SentencesViewer";
import EnglishCombinedViewer from "@/components/viewers/EnglishCombinedViewer";
import type { EnglishOutput, CombinedOutput } from "@/ai/flows/english";

export default async function EnglishViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lesson } = await supabase
    .from("english_lessons")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!lesson) notFound();

  const content = lesson.words as EnglishOutput;

  return (
    <div>
      <PageHeader title={lesson.title} emoji="🔤" backHref="/dashboard/english" />

      {content.contentType === "combined" && (
        <EnglishCombinedViewer data={content as CombinedOutput} />
      )}
      {content.contentType === "words" && (
        <LessonViewer title={lesson.title} words={content.words} />
      )}
      {content.contentType === "dialogue" && (
        <DialogueViewer data={content} />
      )}
      {content.contentType === "sentences" && (
        <SentencesViewer data={content} />
      )}
    </div>
  );
}
