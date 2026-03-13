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

// 한국어 여자 음성 선호 순위
const KO_FEMALE_PRIORITY = [
  "Google 한국의",
  "유나",
  "Yuna",
  "여성",
  "수진",
  "미진",
  "지수",
];

// 한국어 남자 음성 — Neural2-C 계열 우선, fallback: Google 한국어
// ko-KR-Neural2-C: 따뜻하고 자연스러운 중간 음역 남성 (Google Cloud TTS)
// Chrome Web Speech가 내부적으로 같은 모델을 노출하는 경우가 있음
const KO_MALE_PRIORITY = [
  "ko-KR-Neural2-C",
  "ko-KR-Standard-C",
  "Google 한국어",
];

// 한국어 전체 (gender 미지정 시)
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
    const koVoices = voices.filter((v) => v.lang.startsWith(langCode));

    // gender 지정 시 해당 목록 우선 탐색
    if (gender) {
      const priority = gender === "female" ? KO_FEMALE_PRIORITY : KO_MALE_PRIORITY;
      for (const name of priority) {
        const found = koVoices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
        if (found) return found;
      }
      // 남자: 지정 목록에 없으면 null (엉뚱한 음성 사용 방지)
      // 여자: 첫 번째 한국어 음성 사용
      if (gender === "male") return null;
      if (gender === "female" && koVoices.length >= 1) return koVoices[0];
    }

    for (const name of KO_VOICE_PRIORITY) {
      const found = koVoices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
      if (found) return found;
    }
    return (
      koVoices.find((v) => v.localService) ??
      koVoices[0] ??
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

// ── MediaSession + Chrome 미디어 표시기 ──────────────────────────────────────
// 무음 오디오 루프를 재생해 Chrome이 미디어 세션을 인식하도록 함
// Base64 인코딩된 1초짜리 무음 WAV
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
let _silentAudio: HTMLAudioElement | null = null;

function startMediaSession(title = "아장아장 AI 선생님") {
  if (typeof window === "undefined") return;
  // 무음 오디오 재생 → Chrome 탭에 스피커 아이콘 표시
  if (!_silentAudio) {
    _silentAudio = new Audio(SILENT_WAV);
    _silentAudio.loop = true;
    _silentAudio.volume = 0.001;
  }
  _silentAudio.play().catch(() => {});

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: "읽는 중 🔊",
      album: "아장아장",
    });
    navigator.mediaSession.playbackState = "playing";
    // 정지 버튼 핸들러
    navigator.mediaSession.setActionHandler("pause", () => stopSpeaking());
    navigator.mediaSession.setActionHandler("stop", () => stopSpeaking());
  }
}

function stopMediaSession() {
  if (_silentAudio) {
    _silentAudio.pause();
    _silentAudio.currentTime = 0;
  }
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "paused";
    navigator.mediaSession.setActionHandler("pause", null);
    navigator.mediaSession.setActionHandler("stop", null);
  }
}

// 현재 TTS 재생 중 여부 (외부에서 구독 가능)
type SpeakingListener = (v: boolean) => void;
const _speakingListeners = new Set<SpeakingListener>();
let _isSpeaking = false;

export function onSpeakingChange(fn: SpeakingListener) {
  _speakingListeners.add(fn);
  return () => _speakingListeners.delete(fn);
}

function setSpeaking(v: boolean) {
  if (_isSpeaking === v) return;
  _isSpeaking = v;
  _speakingListeners.forEach((fn) => fn(v));
}

export function isTtsSpeaking() {
  return _isSpeaking;
}

// ── 자연스러운 발화 전처리 ────────────────────────────────────────────────────

/**
 * 텍스트에 자연스러운 쉼표/pause 힌트를 삽입해 억양을 개선합니다.
 * Web Speech API는 SSML 미지원 → 구두점으로 prosody 유도
 */
function preprocessText(text: string, lang: "ko" | "en"): string {
  let t = text.trim();
  if (lang === "ko") {
    // 접속사·전환어 앞 쉼표 → 자연스러운 호흡 (더 많은 패턴 추가)
    t = t.replace(
      /\s+(그런데|그러나|하지만|그래서|왜냐하면|그리고|또한|게다가|따라서|결국|드디어|마침내|그때|그날|한편|이때|그러자|그러면|그러므로|즉|다만|물론|사실|아마도|어느새|갑자기|갑작스럽게)\s+/g,
      ", $1 "
    );
    // 호칭 뒤 쉼표 (이름아/야, 선생님, 엄마 등)
    t = t.replace(/([가-힣]{1,4}(?:아|야|이여|여|님|씨))\s+/g, "$1, ");
    // 나열 패턴: ~고 ~고 → 각 '고' 뒤 쉼표
    t = t.replace(/([가-힣]+고)\s+([가-힣]+고)\s+/g, "$1, $2, ");
    // 큰따옴표 인용 → 앞에 pause
    t = t.replace(/"([^"]+)"/g, ', "$1"');
    // 연속 공백 정규화
    t = t.replace(/\s{2,}/g, " ");
  } else {
    // 영어: 관계절·접속사 앞 쉼표
    t = t.replace(/\s+(however|but|because|so|therefore|finally|suddenly|then|meanwhile|suddenly|actually)\s+/gi, ", $1 ");
    t = t.replace(/[""]([^""]+)[""]/g, ', "$1"');
  }
  return t;
}

/**
 * 문장 특성 + 성별에 따라 rate/pitch를 동적으로 조정합니다.
 *
 * 한국어 여자 (female / 기본): 따뜻하고 밝은 아나운서 느낌
 *   - pitch 1.04 기준, 질문/감탄 시 자연스럽게 올라감
 *   - rate 0.87 (약간 느리게 → 교육 콘텐츠에 적합)
 *
 * 한국어 남자 (male): 낮고 차분한 나레이터 느낌
 *   - pitch 0.78 기준 (여자 대비 약 26% 낮춤)
 *   - rate 0.82 (차분하고 또렷하게)
 */
function getAdaptiveParams(
  text: string,
  lang: "ko" | "en",
  gender?: "female" | "male",
  overrideRate?: number,
  overridePitch?: number,
): { rate: number; pitch: number } {
  const isQuestion  = /[?？]/.test(text);
  const isExclaim   = /[!！]/.test(text);
  const wordCount   = text.trim().split(/\s+/).length;
  const isShortWord = wordCount <= 2;
  const isLongText  = text.length > 120;
  const isSentence  = text.length > 30; // 문장 길이 판별

  if (lang === "ko") {
    if (gender === "male") {
      // ── 남자: ko-KR-Neural2-C 특성 기준 ──
      // Neural2-C: 중간 음역 남성, 극단적으로 낮지 않고 따뜻하고 또렷함
      // pitch 0.90 — 너무 낮지 않게, 자연스러운 남성 음역
      // rate 0.92 — Neural2-C는 자연스럽고 다소 빠른 편
      let rate  = isLongText ? 0.89 : isShortWord ? 0.82 : 0.92;
      let pitch = 0.80;
      if (isQuestion)       { pitch = 0.86; rate = Math.max(rate - 0.02, 0.80); }
      else if (isExclaim)   { pitch = 0.84; rate = Math.min(rate + 0.02, 0.94); }
      else if (isShortWord) { pitch = 0.82; rate = 0.82; }
      return { rate: overrideRate ?? rate, pitch: overridePitch ?? pitch };
    }

    // ── 여자 (female 또는 기본): 따뜻하고 밝은 아나운서 ──
    // 긴 텍스트(동화 등): rate 낮춰 자연스러운 낭독 속도 유지
    let rate  = isLongText ? 0.80 : isShortWord ? 0.79 : 0.87;
    let pitch = isLongText ? 1.00 : 1.04; // 긴 텍스트는 pitch 낮춰 기계음 감소
    if (isQuestion)       { pitch += 0.16; rate -= 0.02; }
    else if (isExclaim)   { pitch += 0.10; rate += 0.03; }
    else if (isShortWord) { pitch  = 1.08; rate  = 0.79; }
    else if (isSentence && !isLongText) { pitch = 1.05; }
    return { rate: overrideRate ?? rate, pitch: overridePitch ?? pitch };
  }

  // ── 영어 ──
  // 남자: Aaron/Alex 등 실제 남성 음성 기준 → pitch 0.95 (자연 음역에 가깝게)
  // 여자: Ava/Samantha 등 여성 음성 기준 → pitch 1.22
  const base = gender === "female"
    ? { rate: 0.90, pitch: 1.22 }
    : gender === "male"
    ? { rate: 0.88, pitch: 0.95 }
    : { rate: 0.90, pitch: 1.08 };

  let { rate, pitch } = base;
  if (isQuestion) {
    pitch += gender === "male" ? 0.10 : 0.13;
    rate  -= 0.02;
  } else if (isExclaim) {
    pitch += gender === "male" ? 0.06 : 0.08;
    rate  += gender === "male" ? 0.02 : 0.03;
  } else if (isShortWord) {
    pitch += gender === "male" ? 0.04 : 0.06;
    rate  -= gender === "male" ? 0.07 : 0.08;
  } else if (isLongText) {
    rate  -= gender === "male" ? 0.03 : 0.04;
  }

  return {
    rate:  overrideRate  ?? rate,
    pitch: overridePitch ?? pitch,
  };
}

export interface SpeakOptions {
  lang?: "ko" | "en";
  rate?: number;
  pitch?: number;
  gender?: "female" | "male";
  onEnd?: () => void;
  raw?: boolean; // true면 preprocessText 생략
}

/** Web Speech 보이스 사전 로드 (앱 시작 시 호출 → 첫 재생 지연 제거) */
export function preloadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  // getVoices() 호출 자체가 브라우저에 음성 목록 요청을 트리거
  const voices = synth.getVoices();
  if (voices.length === 0) {
    // 아직 로드 안 됐으면 이벤트 등록해서 캐싱 유도
    synth.addEventListener("voiceschanged", () => {
      synth.getVoices(); // 목록 캐싱 트리거
    }, { once: true });
  }
}

/** 단일 텍스트 재생 (단어 카드, 예문, 동화 전체 등) */
export function speak(text: string, options: SpeakOptions = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const { lang = "ko", gender, onEnd } = options;

  // cancel 전에 재생 중이었는지 체크 → 재생 중이었으면 80ms 대기, 아니면 즉시 재생
  const hadSpeech = synth.speaking || synth.pending;
  stopKeepAlive();
  stopMediaSession();
  setSpeaking(false);
  synth.cancel();

  const doSpeak = () => {
    const voice = getBestVoice(lang, gender);
    // raw=true 또는 긴 텍스트(동화 등)는 preprocessText 생략 — 따옴표 앞 콤마 삽입으로 Chrome 묵음 유발
    const processed = (options.raw || text.length > 150) ? text : preprocessText(text, lang);
    const { rate, pitch } = getAdaptiveParams(text, lang, gender, options.rate, options.pitch);

    const utter = new SpeechSynthesisUtterance(processed);
    if (voice) utter.voice = voice;
    utter.lang = lang === "ko" ? "ko-KR" : "en-US";
    utter.volume = 1;
    utter.rate = rate;
    utter.pitch = pitch;

    utter.onstart = () => { setSpeaking(true); startMediaSession(); startKeepAlive(); };
    utter.onend = () => { stopKeepAlive(); stopMediaSession(); setSpeaking(false); onEnd?.(); };
    utter.onerror = (e) => {
      stopKeepAlive(); stopMediaSession(); setSpeaking(false);
      const err = (e as SpeechSynthesisErrorEvent).error;
      if (err !== "interrupted" && err !== "canceled") onEnd?.();
    };

    synth.speak(utter);
  };

  // 재생 중이었으면 cancel 후 80ms 대기 (Chrome 내부 상태 정리), 아니면 즉시 실행
  let called = false;
  const trySpeak = () => {
    if (called) return;
    called = true;
    if (hadSpeech) {
      setTimeout(doSpeak, 80);
    } else {
      doSpeak();
    }
  };

  if (synth.getVoices().length > 0) {
    trySpeak();
  } else {
    synth.addEventListener("voiceschanged", () => trySpeak(), { once: true });
    setTimeout(() => { if (synth.getVoices().length > 0) trySpeak(); }, 500);
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
  stopMediaSession();
  setSpeaking(false);
  if (typeof window !== "undefined") {
    window.speechSynthesis.cancel();
  }
}

/**
 * 긴 텍스트용 TTS — 문장 체이닝 방식
 * 큐잉(한번에 모두 speak) 대신 각 문장이 끝나면 다음 문장을 재생 (Chrome에서 더 안정적)
 */
export function speakLong(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  const { lang = "ko", gender, onEnd } = opts;

  // 문장 분리: 마침표·느낌표·물음표 뒤 공백, 또는 줄바꿈
  const raw = text.split(/(?<=[.!?。！？])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  // 분리 결과 없으면 통째로 처리
  const sentences = raw.length > 0 ? raw : [text.trim()].filter(Boolean);
  if (sentences.length === 0) return;

  const hadSpeech = synth.speaking || synth.pending;
  stopKeepAlive();
  stopMediaSession();
  synth.cancel();

  let idx = 0;
  let aborted = false;

  function speakNext() {
    if (aborted || idx >= sentences.length) {
      if (!aborted) { stopKeepAlive(); stopMediaSession(); setSpeaking(false); onEnd?.(); }
      return;
    }

    const sentence = sentences[idx++];
    const voice = getBestVoice(lang, gender);
    const processed = preprocessText(sentence, lang);
    const { rate, pitch } = getAdaptiveParams(sentence, lang, gender, opts.rate, opts.pitch);

    const utter = new SpeechSynthesisUtterance(processed);
    if (voice) utter.voice = voice;
    utter.lang = lang === "ko" ? "ko-KR" : "en-US";
    utter.volume = 1;
    utter.rate = rate;
    utter.pitch = pitch;

    if (idx === 1) {
      // 첫 문장 시작 시 MediaSession 설정
      utter.onstart = () => { setSpeaking(true); startMediaSession(); startKeepAlive(); };
    }
    utter.onend = () => {
      if (!aborted) setTimeout(speakNext, 80);
    };
    utter.onerror = (e) => {
      const err = (e as SpeechSynthesisErrorEvent).error;
      if (err === "interrupted" || err === "canceled") {
        aborted = true; stopKeepAlive(); stopMediaSession(); setSpeaking(false);
        return;
      }
      // 일반 에러는 다음 문장으로
      if (!aborted) setTimeout(speakNext, 150);
    };

    if (synth.paused) synth.resume();
    synth.speak(utter);
  }

  // 재생 중이었으면 100ms 대기, 아니면 즉시 실행
  if (synth.getVoices().length > 0) {
    if (hadSpeech) {
      setTimeout(speakNext, 100);
    } else {
      speakNext();
    }
  } else {
    synth.addEventListener("voiceschanged", () => { hadSpeech ? setTimeout(speakNext, 100) : speakNext(); }, { once: true });
    setTimeout(() => { if (synth.getVoices().length > 0) { hadSpeech ? setTimeout(speakNext, 100) : speakNext(); } }, 500);
  }
}
