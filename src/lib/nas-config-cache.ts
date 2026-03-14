import { createServerSupabaseClient } from "@/lib/supabase-server";

export type NasConfig = {
  baseUrl: string;
  username: string;
  password: string;
  folderPath: string;
  authHeader: string;
};

/** 서버 프로세스 내 메모리 캐시 — Supabase 쿼리를 최소화 */
let _cache: { config: NasConfig; ts: number } | null = null;
const TTL = 60_000; // 60초

export async function getNasConfig(): Promise<NasConfig | null> {
  if (_cache && Date.now() - _cache.ts < TTL) return _cache.config;

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["nas_host", "nas_port", "nas_https", "nas_username", "nas_password", "nas_folder_path"]);

  if (!data) return null;

  const cfg: Record<string, string> = {};
  data.forEach(({ key, value }) => { cfg[key] = value; });

  if (!cfg.nas_host || !cfg.nas_username || !cfg.nas_password) return null;

  const protocol = cfg.nas_https === "false" ? "http" : "https";
  const port = cfg.nas_port ?? "7777";

  const config: NasConfig = {
    baseUrl: `${protocol}://${cfg.nas_host}:${port}`,
    username: cfg.nas_username,
    password: cfg.nas_password,
    folderPath: (cfg.nas_folder_path ?? "/video/kids").replace(/\/$/, ""),
    authHeader: "Basic " + Buffer.from(`${cfg.nas_username}:${cfg.nas_password}`).toString("base64"),
  };

  _cache = { config, ts: Date.now() };
  return config;
}

/** 관리자가 설정 변경 시 캐시 무효화 */
export function invalidateNasConfig() {
  _cache = null;
}
