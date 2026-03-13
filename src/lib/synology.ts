/** 시놀로지 File Station API + WebDAV 헬퍼 */

export type SynoFile = {
  name: string;
  isdir: boolean;
  path: string;
};

/** SSL 인증서 검증 없이 fetch (로컬 IP 접속 시 인증서 불일치 우회) */
async function synoFetch(url: string): Promise<Response> {
  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    return await fetch(url);
  } finally {
    if (prev === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
    }
  }
}

export async function synoLogin(dsmUrl: string, user: string, pass: string): Promise<string> {
  const url =
    `${dsmUrl}/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login` +
    `&account=${encodeURIComponent(user)}&passwd=${encodeURIComponent(pass)}` +
    `&session=FileStation&format=sid`;

  const res = await synoFetch(url);
  const json = await res.json();

  if (!json.success) {
    const msg: Record<number, string> = {
      400: "잘못된 아이디 또는 비밀번호",
      401: "계정 비활성화",
      402: "권한 거부",
      403: "2단계 인증 필요",
    };
    throw new Error(msg[json.error?.code] ?? `인증 실패 (code: ${json.error?.code})`);
  }

  return json.data.sid as string;
}

export async function synoListDir(dsmUrl: string, sid: string, path: string): Promise<SynoFile[]> {
  const url =
    `${dsmUrl}/webapi/entry.cgi?api=SYNO.FileStation.List&version=2&method=list` +
    `&folder_path=${encodeURIComponent(path)}&_sid=${sid}`;

  const res = await synoFetch(url);
  const json = await res.json();

  if (!json.success) throw new Error(`파일 목록 실패 (code: ${json.error?.code})`);
  return (json.data?.files ?? []) as SynoFile[];
}

export function synoDownloadUrl(dsmUrl: string, sid: string, filePath: string): string {
  return (
    `${dsmUrl}/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download` +
    `&path=${encodeURIComponent(filePath)}&mode=open&_sid=${sid}`
  );
}

/** WebDAV PROPFIND로 폴더 내용 조회 (포트 7777 사용) */
export async function webdavList(
  baseUrl: string,
  user: string,
  pass: string,
  path: string,
): Promise<SynoFile[]> {
  const normalizedPath = path.endsWith("/") ? path : path + "/";
  const url = `${baseUrl}${normalizedPath}`;
  const auth = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

  const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    const res = await fetch(url, {
      method: "PROPFIND",
      headers: {
        Authorization: auth,
        Depth: "1",
        "Content-Type": "application/xml",
      },
      body: `<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/><D:displayname/></D:prop></D:propfind>`,
    });

    if (res.status === 401) throw new Error("인증 실패 — 아이디/비밀번호를 확인해주세요");
    if (res.status === 403) throw new Error("권한 없음 — WebDAV 접근 권한을 확인해주세요");
    if (res.status === 404) throw new Error("폴더를 찾을 수 없어요 — 경로를 확인해주세요");
    if (res.status !== 207 && !res.ok) throw new Error(`WebDAV 오류: HTTP ${res.status}`);

    const text = await res.text();
    return parseWebDavResponse(text, normalizedPath);
  } finally {
    if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev;
  }
}

function parseWebDavResponse(xml: string, basePath: string): SynoFile[] {
  const files: SynoFile[] = [];
  const responses = xml.match(/<[^:]*:?response[\s\S]*?<\/[^:]*:?response>/gi) ?? [];

  for (const block of responses) {
    const hrefMatch = block.match(/<[^:]*:?href[^>]*>([\s\S]*?)<\/[^:]*:?href>/i);
    if (!hrefMatch) continue;

    const href = decodeURIComponent(hrefMatch[1].trim());
    // basePath 자체는 건너뜀
    const normalizedHref = href.endsWith("/") ? href : href + "/";
    if (normalizedHref === basePath) continue;

    const isdir = /<[^:]*:?collection\s*\/>/.test(block);
    const name = href.replace(/\/$/, "").split("/").pop() ?? "";
    if (!name) continue;

    files.push({ name, isdir, path: href });
  }

  return files;
}
