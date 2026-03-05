import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { text, voice_id, api_key } = await req.json();

  if (!text?.trim()) {
    return Response.json({ error: "text가 비어있습니다." }, { status: 400 });
  }
  if (!voice_id) {
    return Response.json({ error: "voice_id가 필요합니다." }, { status: 400 });
  }
  if (!api_key) {
    return Response.json({ error: "api_key가 필요합니다." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: "POST",
      headers: {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[TTS] ElevenLabs 오류:", res.status, errText);
      return Response.json({ error: `ElevenLabs 오류: ${res.status}` }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[TTS] 오류:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
