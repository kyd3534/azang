import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { webdavList } from "@/lib/synology";

const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["nas_host", "nas_port", "nas_https", "nas_username", "nas_password", "nas_folder_path"]);

  const config: Record<string, string> = {};
  data?.forEach(({ key, value }) => { config[key] = value; });

  const { nas_host, nas_port, nas_https, nas_username, nas_password, nas_folder_path } = config;

  if (!nas_host || !nas_username || !nas_password) {
    return NextResponse.json({ files: [], error: "NAS 설정이 필요해요" });
  }

  const protocol = nas_https === "false" ? "http" : "https";
  const port = nas_port ?? "7777";
  const baseUrl = `${protocol}://${nas_host}:${port}`;
  const folderPath = nas_folder_path ?? "/video/kids";

  try {
    const entries = await webdavList(baseUrl, nas_username, nas_password, folderPath);
    const files = entries.filter(f => !f.isdir && VIDEO_EXT.test(f.name)).map(f => f.name);
    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ files: [], error: String(err) });
  }
}
