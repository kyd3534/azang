import { NextRequest, NextResponse } from "next/server";
import { getNasConfig } from "@/lib/nas-config-cache";

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get("file");
  if (!filename) return NextResponse.json({ error: "file 파라미터가 필요해요" }, { status: 400 });

  const config = await getNasConfig();
  if (!config) return NextResponse.json({ error: "NAS 미설정" }, { status: 503 });

  const videoUrl = `${config.baseUrl}${config.folderPath}/${filename}`;
  const range = req.headers.get("range");

  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  let upstream: Response;
  try {
    upstream = await fetch(videoUrl, {
      headers: {
        Authorization: config.authHeader,
        ...(range ? { Range: range } : {}),
      },
    });
  } finally {
    if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }

  const headers = new Headers();
  for (const h of ["content-type", "content-length", "content-range"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  // WebDAV는 range 요청을 지원하므로 항상 명시 — 브라우저 seek 최적화
  headers.set("accept-ranges", "bytes");

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
