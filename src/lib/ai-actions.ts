"use server";

import { createServerSupabaseClient } from "./supabase-server";
import { storyFlow, type StoryInput } from "@/ai/flows/story";
import { englishFlow, type EnglishInput, type CombinedOutput } from "@/ai/flows/english";
import { hangulFlow, type HangulInput, type HangulCombinedOutput } from "@/ai/flows/hangul";
import { numbersFlow, type NumberInput, type NumbersCombinedOutput } from "@/ai/flows/numbers";
import { coloringFlow, type ColoringInput } from "@/ai/flows/coloring";

export async function generateStory(input: StoryInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const result = await storyFlow(input);

  const { data, error } = await supabase.from("stories").insert({
    user_id: user.id,
    title: result.title,
    content: { version: 2, sections: result.sections, moral: result.moral },
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateEnglishLesson(input: EnglishInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const result = await englishFlow(input) as CombinedOutput;

  const { data, error } = await supabase.from("english_lessons").insert({
    user_id: user.id,
    title: result.title,
    words: result,  // 전체 구조 저장
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateHangulLesson(input: HangulInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const result = await hangulFlow(input) as HangulCombinedOutput;

  const { data, error } = await supabase.from("hangul_lessons").insert({
    user_id: user.id,
    title: result.title,
    characters: result,  // 전체 구조 저장
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateNumberLesson(input: NumberInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const result = await numbersFlow(input) as NumbersCombinedOutput;

  const { data, error } = await supabase.from("number_lessons").insert({
    user_id: user.id,
    title: result.title,
    numbers: result,  // 전체 구조 저장
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateColoringPage(input: ColoringInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const result = await coloringFlow(input);

  const { data, error } = await supabase.from("coloring_pages").insert({
    user_id: user.id,
    title: result.title,
    svg_content: result.svgContent,
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}
