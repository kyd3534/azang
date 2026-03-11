"use server";

import { createServerSupabaseClient } from "./supabase-server";
import { storyFlow, type StoryInput } from "@/ai/flows/story";
import { englishFlow, type EnglishInput, type CombinedOutput } from "@/ai/flows/english";
import { hangulFlow, type HangulInput, type HangulCombinedOutput } from "@/ai/flows/hangul";
import { numbersFlow, type NumberInput, type NumbersCombinedOutput } from "@/ai/flows/numbers";
import { coloringFlow, type ColoringInput } from "@/ai/flows/coloring";
import { buildCacheKey, checkCache, saveCache, checkAndIncrementLimit } from "./generation-utils";

const ADMIN_EMAIL = "kyd3534@gmail.com";

function getExpiresAt(isAdmin: boolean): string | null {
  if (isAdmin) return null; // 관리자 콘텐츠는 영구 보존
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export async function generateStory(input: StoryInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const isAdmin = user.email === ADMIN_EMAIL;
  const cacheKey = await buildCacheKey("story", input.ageGroup, input.theme);
  const cached = await checkCache(cacheKey);

  let result: Awaited<ReturnType<typeof storyFlow>>;
  if (cached) {
    result = cached as typeof result;
  } else {
    if (!isAdmin) await checkAndIncrementLimit(user.id);
    result = await storyFlow(input);
    await saveCache(cacheKey, "story", result);
  }

  const { data, error } = await supabase.from("stories").insert({
    user_id: user.id,
    title: result.title,
    content: { version: 2, sections: result.sections, moral: result.moral },
    expires_at: getExpiresAt(isAdmin),
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateEnglishLesson(input: EnglishInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const isAdmin = user.email === ADMIN_EMAIL;
  const cacheKey = await buildCacheKey("english", input.ageGroup, input.topic ?? "일상생활");
  const cached = await checkCache(cacheKey);

  let result: CombinedOutput;
  if (cached) {
    result = cached as CombinedOutput;
  } else {
    if (!isAdmin) await checkAndIncrementLimit(user.id);
    result = await englishFlow(input) as CombinedOutput;
    await saveCache(cacheKey, "english", result);
  }

  const { data, error } = await supabase.from("english_lessons").insert({
    user_id: user.id,
    title: result.title,
    words: result,
    expires_at: getExpiresAt(isAdmin),
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateHangulLesson(input: HangulInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const isAdmin = user.email === ADMIN_EMAIL;
  const cacheKey = await buildCacheKey("hangul", input.ageGroup, input.topic ?? "일상생활");
  const cached = await checkCache(cacheKey);

  let result: HangulCombinedOutput;
  if (cached) {
    result = cached as HangulCombinedOutput;
  } else {
    if (!isAdmin) await checkAndIncrementLimit(user.id);
    result = await hangulFlow(input) as HangulCombinedOutput;
    await saveCache(cacheKey, "hangul", result);
  }

  const { data, error } = await supabase.from("hangul_lessons").insert({
    user_id: user.id,
    title: result.title,
    characters: result,
    expires_at: getExpiresAt(isAdmin),
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateNumberLesson(input: NumberInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const isAdmin = user.email === ADMIN_EMAIL;
  const cacheKey = await buildCacheKey("numbers", input.ageGroup, input.theme ?? "일상생활");
  const cached = await checkCache(cacheKey);

  let result: NumbersCombinedOutput;
  if (cached) {
    result = cached as NumbersCombinedOutput;
  } else {
    if (!isAdmin) await checkAndIncrementLimit(user.id);
    result = await numbersFlow(input) as NumbersCombinedOutput;
    await saveCache(cacheKey, "numbers", result);
  }

  const { data, error } = await supabase.from("number_lessons").insert({
    user_id: user.id,
    title: result.title,
    numbers: result,
    expires_at: getExpiresAt(isAdmin),
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}

export async function generateColoringPage(input: ColoringInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요해요.");

  const isAdmin = user.email === ADMIN_EMAIL;
  const cacheKey = await buildCacheKey("coloring", null, input.subject);
  const cached = await checkCache(cacheKey);

  let result: Awaited<ReturnType<typeof coloringFlow>>;
  if (cached) {
    result = cached as typeof result;
  } else {
    if (!isAdmin) await checkAndIncrementLimit(user.id);
    result = await coloringFlow(input);
    await saveCache(cacheKey, "coloring", result);
  }

  const { data, error } = await supabase.from("coloring_pages").insert({
    user_id: user.id,
    title: result.title,
    svg_content: result.svgContent,
    expires_at: getExpiresAt(isAdmin),
  }).select().single();

  if (error) throw new Error("저장 중 오류가 발생했어요.");
  return { ...result, id: data.id };
}
