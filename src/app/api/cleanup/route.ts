import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Vercel Cron이 호출하는 정리 엔드포인트
// vercel.json에서 매주 월요일 새벽 3시(KST) 자동 실행
export async function GET(req: Request) {
  // 크론 시크릿 검증 (무단 호출 방지)
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("cleanup_expired_content");

  if (error) {
    console.error("cleanup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data?.[0] ?? {};
  console.log("cleanup result:", result);

  return NextResponse.json({
    ok: true,
    deleted: {
      stories:         result.deleted_stories  ?? 0,
      english_lessons: result.deleted_lessons  ?? 0,
      hangul_lessons:  result.deleted_hangul   ?? 0,
      number_lessons:  result.deleted_numbers  ?? 0,
      coloring_pages:  result.deleted_coloring ?? 0,
      cache:           result.deleted_cache    ?? 0,
    },
    timestamp: new Date().toISOString(),
  });
}
