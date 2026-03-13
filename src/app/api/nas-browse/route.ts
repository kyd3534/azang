import { NextRequest, NextResponse } from "next/server";
import { webdavList } from "@/lib/synology";

const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;

export async function POST(req: NextRequest) {
  const { host, port, useHttps, username, password, path } = await req.json();

  if (!host || !username || !password) {
    return NextResponse.json({ error: "호스트, 사용자, 암호가 필요해요" });
  }

  const protocol = useHttps === false ? "http" : "https";
  const baseUrl = `${protocol}://${host.trim()}:${port ?? "7777"}`;
  const browsePath = path ?? "/";

  try {
    const entries = await webdavList(baseUrl, username.trim(), password, browsePath);

    const folders = entries.filter(f => f.isdir).map(f => f.name);
    const files = entries.filter(f => !f.isdir && VIDEO_EXT.test(f.name)).map(f => f.name);

    return NextResponse.json({ folders, files, baseUrl });
  } catch (err) {
    const cause = (err as NodeJS.ErrnoException).cause;
    return NextResponse.json({
      folders: [],
      files: [],
      error: String(err),
      cause: cause ? String(cause) : undefined,
      baseUrl,
    });
  }
}
