import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import PageHeader from "@/components/ui/page-header";
import ColoringStudio from "@/components/coloring/ColoringStudio";
import { getCharacterById } from "@/components/coloring/presetCharacters";

export default async function CharacterColoringPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const character = getCharacterById(name);
  if (!character) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Load saved strokes for this preset character
  const pageId = user ? `character_${name}_${user.id}` : `character_${name}`;
  let initialFills: Record<string, string> = {};

  if (user) {
    const { data } = await supabase
      .from("coloring_strokes")
      .select("strokes")
      .eq("page_id", pageId)
      .single();
    if (data?.strokes) initialFills = data.strokes as Record<string, string>;
  }

  return (
    <div>
      <PageHeader
        title={`${character.label} (${character.name})`}
        emoji={character.emoji}
        backHref="/dashboard/coloring"
      />
      <p className="text-sm text-gray-400 mb-4">{character.description}</p>
      <div className="max-w-2xl">
        <ColoringStudio
          svgContent={character.svg}
          pageId={pageId}
          title={character.label}
          initialFills={initialFills}
          persistToDb={!!user}
        />
      </div>
    </div>
  );
}
