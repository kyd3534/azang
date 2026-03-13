"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { speak as webSpeak, stopSpeaking as webStop, onSpeakingChange, preloadVoices, type SpeakOptions } from "@/lib/tts";

export interface VoiceProfile {
  id: string;
  name: string;
  voice_id: string;
}

interface VoiceContextValue {
  profiles: VoiceProfile[];
  apiKey: string;
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  tts: (text: string, opts?: SpeakOptions) => void;
  playWith: (text: string, voiceId: string, opts?: SpeakOptions) => void;
  stop: () => void;
  ready: boolean;
  speaking: boolean; // Web Speech 재생 중 여부
  refresh: () => Promise<void>; // Supabase에서 최신 설정 재로드
}

const VoiceContext = createContext<VoiceContextValue>({
  profiles: [],
  apiKey: "",
  selectedVoiceId: "",
  setSelectedVoiceId: () => {},
  tts: (text, opts) => webSpeak(text, opts),
  playWith: (text, _voiceId, opts) => webSpeak(text, opts),
  stop: () => {},
  ready: false,
  speaking: false,
  refresh: async () => {},
});

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [selectedVoiceId, setSelectedVoiceIdState] = useState("");
  const [ready, setReady] = useState(false);
  const [speaking, setSpeakingState] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const userIdRef = useRef<string>("");

  // Web Speech 재생 상태 구독
  useEffect(() => {
    const unsub = onSpeakingChange((v) => setSpeakingState(v));
    return () => { unsub(); };
  }, []);

  async function loadFromDb() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setReady(true); return; }
    userIdRef.current = user.id;

    const { data, error } = await supabase
      .from("profiles")
      .select("elevenlabs_api_key, voice_profiles, active_voice_id")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setApiKey(data.elevenlabs_api_key ?? "");
      if (Array.isArray(data.voice_profiles) && data.voice_profiles.length > 0) {
        setProfiles(data.voice_profiles as VoiceProfile[]);
      } else {
        setProfiles([]);
      }
      // active_voice_id 없으면 기본값 "__female__"
      setSelectedVoiceIdState(data.active_voice_id ?? "__female__");
    }
    setReady(true);
  }

  useEffect(() => {
    preloadVoices(); // 앱 시작 시 음성 목록 미리 로드 → 첫 재생 지연 제거
    loadFromDb();
  }, []);

  function setSelectedVoiceId(id: string) {
    setSelectedVoiceIdState(id);
    if (userIdRef.current) {
      const supabase = createClient();
      supabase.from("profiles")
        .update({ active_voice_id: id || null })
        .eq("id", userIdRef.current)
        .then(() => {});
    }
  }

  function stop() {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    webStop();
  }

  function _playElevenLabs(text: string, voiceId: string, opts?: SpeakOptions) {
    stop();
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId, api_key: apiKey }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`TTS ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          opts?.onEnd?.();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          webSpeak(text, opts);
        };
        audio.play().catch(() => webSpeak(text, opts));
      })
      .catch(() => webSpeak(text, opts));
  }

  function tts(text: string, opts?: SpeakOptions) {
    if (selectedVoiceId === "" || selectedVoiceId === "__female__") {
      webSpeak(text, { ...opts, gender: "female" });
      return;
    }
    if (selectedVoiceId === "__male__") {
      webSpeak(text, { ...opts, gender: "male" });
      return;
    }
    // ElevenLabs ID
    if (apiKey) {
      _playElevenLabs(text, selectedVoiceId, opts);
    } else {
      webSpeak(text, { ...opts, gender: "female" });
    }
  }

  function playWith(text: string, voiceId: string, opts?: SpeakOptions) {
    setSelectedVoiceId(voiceId);
    if (!voiceId || !apiKey) {
      webSpeak(text, opts);
      return;
    }
    _playElevenLabs(text, voiceId, opts);
  }

  return (
    <VoiceContext.Provider value={{ profiles, apiKey, selectedVoiceId, setSelectedVoiceId, tts, playWith, stop, ready, speaking, refresh: loadFromDb }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
