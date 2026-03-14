import { NextRequest, NextResponse } from "next/server";
import { getNasConfig } from "@/lib/nas-config-cache";
import { webdavList } from "@/lib/synology";

const VIDEO_EXT = /\.(mp4|webm|mov|avi|mkv|m4v)$/i;

/** 서버 메모리 내 폴더 목록 캐시 (경로별 30초 TTL) */
const listingCache = new Map<string, { files: string[]; folders: string[]; ts: number }>();
const LISTING_TTL = 30_000;

export async function GET(req: NextRequest) {
  const subpath = req.nextUrl.searchParams.get("subpath") ?? "";

  const config = await getNasConfig();
  if (!config) {
    return NextResponse.json({ files: [], folders: [], error: "NAS 설정이 필요해요" });
  }

  // 캐시 히트
  const cached = listingCache.get(subpath);
  if (cached && Date.now() - cached.ts < LISTING_TTL) {
    return NextResponse.json(
      { files: cached.files, folders: cached.folders },
      { headers: { "X-Cache": "HIT" } }
    );
  }

  const browsePath = subpath
    ? `${config.folderPath}/${subpath}`
    : config.folderPath;

  try {
    const entries = await webdavList(config.baseUrl, config.username, config.password, browsePath);
    const folders = entries.filter(f => f.isdir).map(f => f.name);
    const files = entries.filter(f => !f.isdir && VIDEO_EXT.test(f.name)).map(f => f.name);

    listingCache.set(subpath, { files, folders, ts: Date.now() });

    return NextResponse.json({ files, folders });
  } catch (err) {
    return NextResponse.json({ files: [], folders: [], error: String(err) });
  }
}
