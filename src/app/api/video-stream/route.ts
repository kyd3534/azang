/**
 * 시놀로지 File Station API를 통해 영상 스트리밍
 * 브라우저를 NAS 다운로드 URL로 리다이렉트 (Vercel 대역폭 절약)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { synoLogin, synoDownloadUrl } from "@/lib/synology";

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("file");
  if (!filename) return NextResponse.json({ error: "file 파라미터가 필요해요" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["nas_host", "nas_username", "nas_password", "nas_folder_path"]);

  const config: Record<string, string> = {};
  data?.forEach(({ key, value }) => { config[key] = value; });

  const { nas_host, nas_username, nas_password, nas_folder_path } = config;
  if (!nas_host || !nas_username || !nas_password) {
    return NextResponse.json({ error: "NAS 미설정" }, { status: 503 });
  }

  const folderPath = (nas_folder_path ?? "/video/kids").replace(/\/$/, "");
  const filePath = `${folderPath}/${filename}`;

  try {
    const sid = await synoLogin(nas_host, nas_username, nas_password);
    const downloadUrl = synoDownloadUrl(nas_host, sid, filePath);
    return NextResponse.redirect(downloadUrl, 302);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
