"use server";

import { createServerSupabaseClient } from "./supabase-server";

// 캐시 키 생성 (정규화: 소문자, 공백제거)
export async function buildCacheKey(type: string, ageGroup: string | null, topic: string): Promise<string> {
  const normalized = topic.trim().toLowerCase().replace(/\s+/g, "");
  return ageGroup ? `${type}:${ageGroup}:${normalized}` : `${type}:${normalized}`;
}

// 캐시 조회 (만료된 캐시는 무시)
export async function checkCache(cacheKey: string): Promise<Record<string, unknown> | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_cache")
    .select("result")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .single();
  return data?.result ?? null;
}

// 캐시 저장 (upsert)
export async function saveCache(cacheKey: string, contentType: string, result: unknown): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("content_cache").upsert(
    {
      cache_key: cacheKey,
      content_type: contentType,
      result,
      used_count: 1,
      expires_at: expiresAt,
    },
    { onConflict: "cache_key", ignoreDuplicates: false }
  );
  // used_count 증가 (upsert 후 별도 update, 실패해도 무시)
  void supabase.rpc("increment_cache_used", { key: cacheKey });
}

// 월 한도 체크 (초과 시 에러 throw) + 필요 시 월 리셋
export async function checkAndIncrementLimit(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("generation_count, generation_limit, generation_reset_at")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const now = new Date();
  const resetAt = new Date(profile.generation_reset_at);

  // 월 리셋 필요한지 체크
  if (now >= resetAt) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await supabase.from("profiles").update({
      generation_count: 0,
      generation_reset_at: nextMonth.toISOString(),
    }).eq("id", userId);
    return; // 리셋 후 첫 번째 생성이므로 한도 초과 아님
  }

  if (profile.generation_count >= profile.generation_limit) {
    const resetDate = resetAt.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
    throw new Error(`이번 달 생성 한도(${profile.generation_limit}회)에 도달했어요. ${resetDate}에 초기화돼요.`);
  }

  // 카운트 증가
  await supabase.from("profiles")
    .update({ generation_count: profile.generation_count + 1 })
    .eq("id", userId);
}

// 현재 사용량 조회 (UI용)
export async function getGenerationUsage(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("generation_count, generation_limit, generation_reset_at")
    .eq("id", userId)
    .single();
  return data;
}
