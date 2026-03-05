import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import PageHeader from "@/components/ui/page-header";
import CountingViewer from "@/components/viewers/CountingViewer";
import NumberViewer from "@/components/viewers/NumberViewer";
import OperationsViewer from "@/components/viewers/OperationsViewer";
import NumbersCombinedViewer from "@/components/viewers/NumbersCombinedViewer";
import type { NumbersOutput, NumbersCombinedOutput, NamesOutput } from "@/ai/flows/numbers";

export default async function NumbersViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: lesson } = await supabase
    .from("number_lessons")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!lesson) notFound();

  const content = lesson.numbers as NumbersOutput;

  return (
    <div>
      <PageHeader title={lesson.title} emoji="🎀" backHref="/dashboard/numbers" />

      {content.contentType === "numbers_combined" && (
        <NumbersCombinedViewer data={content as NumbersCombinedOutput} />
      )}
      {content.contentType === "counting" && <CountingViewer data={content} />}
      {content.contentType === "names" && (
        <NumberViewer title={lesson.title} numbers={(content as NamesOutput).numbers} />
      )}
      {content.contentType === "operations" && <OperationsViewer data={content} />}
    </div>
  );
}
