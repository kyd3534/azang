/**
 * 자연스러운 TTS 유틸리티
 * 성별 인식 음성 선택 + 억양/발음 최적화
 * ElevenLabs 사용자 목소리 지원
 */

// ── ElevenLabs API ────────────────────────────────────────────────────────────

/**
 * ElevenLabs API를 이용해 사용자 목소리로 텍스트를 읽습니다.
 * 사용자 프로필의 elevenlabs_api_key + active_voice_id가 설정된 경우에만 동작.
 * 실패 시 기존 Web Speech API로 자동 폴백.
 */
export async function speakWithUserVoice(
  text: string,
  opts: { lang?: "ko" | "en"; onEnd?: () => void; fallback?: () => void } = {}
): Promise<boolean> {
  const { onEnd, fallback } = opts;

  // Supabase에서 ElevenLabs 설정 조회
  let apiKey: string | null = null;
  let activeVoiceId: string | null = null;
  try {
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("elevenlabs_api_key, active_voice_id")
        .eq("id", user.id)
        .single();
      apiKey = data?.elevenlabs_api_key ?? null;
      activeVoiceId = data?.active_voice_id ?? null;
    }
  } catch {
    fallback?.();
    return false;
  }

  // API 키 또는 Voice ID 없으면 폴백
  if (!apiKey || !activeVoiceId) { fallback?.(); return false; }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: activeVoiceId, api_key: apiKey }),
    });
    if (!res.ok) throw new Error(`TTS 오류: ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); onEnd?.(); };
    audio.onerror = () => { URL.revokeObjectURL(url); fallback?.(); };
    audio.play();
    return true;
  } catch {
    fallback?.();
    return false;
  }
}

// 한국어 선호 음성 (품질 순)
const KO_VOICE_PRIORITY = [
  "Google 한국의",
  "Google 한국어",
  "유나",
  "Yuna",
  "여성",
  "수진",
  "미진",
];

// 영어 여성 음성 선호 목록 (미국식, 젊고 밝은 느낌)
const EN_FEMALE_VOICE_PRIORITY = [
  "Ava",          // macOS US - 밝고 젊은
  "Allison",      // macOS US
  "Zoe",          // macOS US
  "Samantha",     // macOS US (클래식)
  "Susan",        // macOS US
  "Google US English",
  "Microsoft Zira",
  "Zira",
];

// 영어 남성 음성 선호 목록 (미국식, 젊은 느낌)
const EN_MALE_VOICE_PRIORITY = [
  "Aaron",        // macOS US - 젊은 남성
  "Nate",         // macOS US
  "Jamie",        // macOS US
  "Alex",         // macOS US
  "Google US English",
  "Microsoft David",
  "David",
];

const EN_VOICE_PRIORITY = [
  "Google US English",
  "Ava",
  "Samantha",
  "Aaron",
  "Alex",
  "Allison",
];

function getBestVoice(lang: "ko" | "en", gender?: "female" | "male"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  const langCode = lang === "ko" ? "ko" : "en";

  if (lang === "ko") {
    for (const name of KO_VOICE_PRIORITY) {
      const found = voices.find((v) =>
        v.name.toLowerCase().includes(name.toLowerCase()) && v.lang.startsWith(langCode)
      );
      if (found) return found;
    }
    return (
      voices.find((v) => v.lang.startsWith(langCode) && v.localService) ??
      voices.find((v) => v.lang.startsWith(langCode)) ??
      null
    );
  }

  // 영어: en-US 로케일을 우선, 없으면 전체 en-* 사용
  const usVoices = voices.filter((v) => v.lang === "en-US");
  const enVoices = voices.filter((v) => v.lang.startsWith(langCode));
  const pool = usVoices.length > 0 ? usVoices : enVoices;

  if (gender) {
    const targets = gender === "female" ? EN_FEMALE_VOICE_PRIORITY : EN_MALE_VOICE_PRIORITY;
    for (const name of targets) {
      const found = pool.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      if (found) return found;
    }
    // pool에서 못 찾으면 전체 en-*에서 재시도
    for (const name of targets) {
      const found = enVoices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      if (found) return found;
    }
  }

  for (const name of EN_VOICE_PRIORITY) {
    const found = pool.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found;
  }
  return (
    pool.find((v) => v.localService) ??
    pool[0] ??
    enVoices[0] ??
    null
  );
}

// ── Chrome Web Speech keepAlive (15초 컷오프 버그 대응) ──────────────────────
let _keepAliveTimer: ReturnType<typeof setInterval> | null = null;

function startKeepAlive() {
  stopKeepAlive();
  _keepAliveTimer = setInterval(() => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.pause();
      synth.resume();
    } else {
      stopKeepAlive();
    }
  }, 10000);
}

function stopKeepAlive() {
  if (_keepAliveTimer !== null) {
    clearInterval(_keepAliveTimer);
    _keepAliveTimer = null;
  }
}

// ── 자연스러운 발화 전처리 ────────────────────────────────────────────────────

/**
 * 텍스트에 자연스러운 쉼표/pause 힌트를 삽입해 억양을 개선합니다.
 * Web Speech API는 SSML 미지원 → 구두점으로 prosody 유도
 */
function preprocessText(text: string, lang: "ko" | "en"): string {
  let t = text.trim();
  if (lang === "ko") {
    // 접속사 앞에 쉼표 → 자연스러운 호흡
    t = t.replace(/\s+(그런데|그러나|하지만|그래서|왜냐하면|그리고|또한|게다가|따라서|결국|드디어|마침내)\s+/g, ", $1 ");
    // 인용/강조 괄호 전처리
    t = t.replace(/["'"']([^"'"']+)["'"']/g, ", $1,");
    // 연속 마침표 공백 정규화
    t = t.replace(/\.\s{2,}/g, ". ");
  } else {
    // 영어: 관계절·접속사 앞 쉼표
    t = t.replace(/\s+(however|but|because|so|therefore|finally|suddenly|then)\s+/gi, ", $1 ");
    t = t.replace(/[""]([^""]+)[""]/g, ", $1,");
  }
  return t;
}

/**
 * 문장 특성을 분석해 rate/pitch를 동적으로 조정합니다.
 * - 질문: pitch ↑ (올라가는 억양)
 * - 감탄: pitch ↑ + rate ↑ (활기차게)
 * - 짧은 단어: rate ↓ (또렷하게)
 * - 긴 텍스트: rate 약간 ↓ (천천히 읽듯)
 */
function getAdaptiveParams(
  text: string,
  lang: "ko" | "en",
  gender?: "female" | "male",
  overrideRate?: number,
  overridePitch?: number,
): { rate: number; pitch: number } {
  const isQuestion = /[?？]/.test(text);
  const isExclaim = /[!！]/.test(text);
  const wordCount = text.trim().split(/\s+/).length;
  const isShortWord = wordCount <= 2;
  const isLongText = text.length > 120;

  if (lang === "ko") {
    let rate = isLongText ? 0.82 : isShortWord ? 0.76 : 0.85;
    let pitch = isQuestion ? 1.22 : isExclaim ? 1.18 : 1.12;
    return {
      rate: overrideRate ?? rate,
      pitch: overridePitch ?? pitch,
    };
  }

  // 영어
  const base = gender === "female"
    ? { rate: 0.90, pitch: 1.30 }
    : gender === "male"
    ? { rate: 0.88, pitch: 1.08 }
    : { rate: 0.90, pitch: 1.12 };

  let { rate, pitch } = base;
  if (isQuestion)      { pitch += 0.14; rate -= 0.02; }
  else if (isExclaim)  { pitch += 0.08; rate += 0.03; }
  else if (isShortWord){ pitch += 0.06; rate -= 0.08; }
  else if (isLongText) { rate  -= 0.04; }

  return {
    rate: overrideRate ?? rate,
    pitch: overridePitch ?? pitch,
  };
}

export interface SpeakOptions {
  lang?: "ko" | "en";
  rate?: number;
  pitch?: number;
  gender?: "female" | "male";
  onEnd?: () => void;
}

/** 단일 텍스트 재생 (단어 카드, 예문, 지문 버튼 등) */
export function speak(text: string, options: SpeakOptions = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;

  const { lang = "ko", gender, onEnd } = options;

  // cancel 전에 미리 체크 (cancel 후엔 speaking이 false가 되므로)
  const hadSpeech = synth.speaking || synth.pending;
  if (hadSpeech) {
    synth.cancel();
  }

  const doSpeak = () => {
    const voice = getBestVoice(lang, gender);
    const processed = preprocessText(text, lang);
    const { rate, pitch } = getAdaptiveParams(text, lang, gender, options.rate, options.pitch);

    const utter = new SpeechSynthesisUtterance(processed);
    if (voice) utter.voice = voice;
    utter.lang = lang === "ko" ? "ko-KR" : "en-US";
    utter.volume = 1;
    utter.rate = rate;
    utter.pitch = pitch;

    utter.onend = () => { stopKeepAlive(); onEnd?.(); };
    utter.onerror = (e) => {
      stopKeepAlive();
      const err = (e as SpeechSynthesisErrorEvent).error;
      // interrupted / canceled 는 의도적 정지 → onEnd 호출 안 함
      if (err !== "interrupted" && err !== "canceled") {
        onEnd?.();
      }
    };

    startKeepAlive();
    if (synth.paused) synth.resume();
    synth.speak(utter);
  };

  // cancel 후 바로 speak하면 Chrome에서 첫 음절만 나오고 끊김
  // → cancel 했을 경우 200ms 대기, 아닐 경우 즉시 실행
  const delay = hadSpeech ? 200 : 0;

  if (synth.getVoices().length > 0) {
    setTimeout(doSpeak, delay);
  } else {
    synth.addEventListener("voiceschanged", () => setTimeout(doSpeak, delay), { once: true });
    setTimeout(() => { if (synth.getVoices().length > 0) setTimeout(doSpeak, delay); }, 1500);
  }
}

// ── 대화 전체 재생 ─────────────────────────────────────────────────────────────

export interface DialogueSpeakLine {
  text: string;
  gender: "female" | "male";
}

/**
 * 여러 대화 라인을 성별 음성으로 순서대로 재생합니다.
 * cancel()을 처음 한 번만 호출하고 이후엔 내부 체인으로 이어갑니다.
 * 반환값: stop 함수
 */
export function speakDialogue(lines: DialogueSpeakLine[], onDone?: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  const synth = window.speechSynthesis;
  synth.cancel();

  let stopped = false;

  const doPlay = () => {
    let lineIdx = 0;

    function nextLine() {
      if (stopped || lineIdx >= lines.length) {
        if (!stopped) onDone?.();
        return;
      }

      const line = lines[lineIdx];
      const prev = lineIdx > 0 ? lines[lineIdx - 1] : null;
      // 화자 바뀔 때 700ms, 연속 같은 화자 250ms 간격
      const pauseMs = prev && prev.gender !== line.gender ? 700 : 250;
      lineIdx++;

      const voice = getBestVoice("en", line.gender);
      const processed = preprocessText(line.text, "en");
      const { rate, pitch } = getAdaptiveParams(line.text, "en", line.gender);
      const utter = new SpeechSynthesisUtterance(processed);
      utter.lang = "en-US";
      if (voice) utter.voice = voice;
      utter.rate = rate;
      utter.pitch = pitch;
      utter.volume = 1;

      utter.onend = () => {
        if (!stopped) setTimeout(nextLine, pauseMs);
      };
      utter.onerror = (e) => {
        if ((e as SpeechSynthesisErrorEvent).error === "interrupted") return;
        if (!stopped) setTimeout(nextLine, pauseMs);
      };

      if (synth.paused) synth.resume();
      synth.speak(utter);
    }

    // cancel() 직후 바로 speak하면 Chrome에서 씹힘 → 80ms 대기
    setTimeout(nextLine, 80);
  };

  if (synth.getVoices().length > 0) {
    doPlay();
  } else {
    synth.addEventListener("voiceschanged", () => doPlay(), { once: true });
    setTimeout(() => { if (synth.getVoices().length > 0) doPlay(); }, 1500);
  }

  return () => {
    stopped = true;
    synth.cancel();
  };
}

export function stopSpeaking() {
  stopKeepAlive();
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}
