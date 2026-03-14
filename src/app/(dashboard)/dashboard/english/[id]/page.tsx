import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import PageHeader from "@/components/ui/page-header";
import LessonViewer from "@/components/viewers/LessonViewer";
import DialogueViewer from "@/components/viewers/DialogueViewer";
import SentencesViewer from "@/components/viewers/SentencesViewer";
import EnglishCombinedViewer from "@/components/viewers/EnglishCombinedViewer";
import SoundImageViewer from "@/components/viewers/SoundImageViewer";
import PhonicsViewer from "@/components/viewers/PhonicsViewer";
import type {
  EnglishOutput,
  CombinedOutput,
  SoundImageOutput,
  AlphabetPhonicsOutput,
  PhonicsSystematicOutput,
  ReadingFluencyOutput,
  AcademicLiteracyOutput,
} from "@/ai/flows/english";

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
      <PageHeader title={lesson.title} emoji="⭐" backHref="/dashboard/english" />

      {/* 새 연령별 레슨 타입 */}
      {content.contentType === "sound_image" && (
        <SoundImageViewer data={content as SoundImageOutput} />
      )}
      {(content.contentType === "alphabet_phonics" ||
        content.contentType === "phonics_systematic" ||
        content.contentType === "reading_fluency" ||
        content.contentType === "academic_literacy") && (
        <PhonicsViewer data={content as AlphabetPhonicsOutput | PhonicsSystematicOutput | ReadingFluencyOutput | AcademicLiteracyOutput} />
      )}

      {/* 하위 호환 — 기존 DB 데이터 */}
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
