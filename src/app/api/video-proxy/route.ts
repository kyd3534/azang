import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("file");
  if (!filename) return NextResponse.json({ error: "file 파라미터가 필요해요" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["nas_host", "nas_port", "nas_username", "nas_password", "nas_https", "nas_folder_path"]);

  const config: Record<string, string> = {};
  data?.forEach(({ key, value }) => { config[key] = value; });

  if (!config.nas_host) return NextResponse.json({ error: "NAS 미설정" }, { status: 503 });

  const protocol = config.nas_https === "false" ? "http" : "https";
  const port = config.nas_port ?? "7777";
  const baseUrl = `${protocol}://${config.nas_host}:${port}`;
  const folderPath = (config.nas_folder_path ?? "/video/kids").replace(/\/$/, "");
  const videoUrl = `${baseUrl}${folderPath}/${filename}`;

  const auth = config.nas_username && config.nas_password
    ? "Basic " + Buffer.from(`${config.nas_username}:${config.nas_password}`).toString("base64")
    : undefined;

  const range = req.headers.get("range");

  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  let upstream: Response;
  try {
    upstream = await fetch(videoUrl, {
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        ...(range ? { Range: range } : {}),
      },
    });
  } finally {
    if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }

  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
