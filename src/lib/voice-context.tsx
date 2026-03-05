"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { speak as webSpeak, stopSpeaking as webStop, type SpeakOptions } from "@/lib/tts";

export interface VoiceProfile {
  id: string;
  name: string;
  voice_id: string;
}

interface VoiceContextValue {
  profiles: VoiceProfile[];
  selectedVoiceId: string;
  setSelectedVoiceId: (id: string) => void;
  tts: (text: string, opts?: SpeakOptions) => void;
  playWith: (text: string, voiceId: string, opts?: SpeakOptions) => void;
  stop: () => void;
  ready: boolean;
}

const VoiceContext = createContext<VoiceContextValue>({
  profiles: [],
  selectedVoiceId: "",
  setSelectedVoiceId: () => {},
  tts: (text, opts) => webSpeak(text, opts),
  playWith: (text, _voiceId, opts) => webSpeak(text, opts),
  stop: () => {},
  ready: false,
});

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [selectedVoiceId, setSelectedVoiceIdState] = useState("");
  const [ready, setReady] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const userIdRef = useRef<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setReady(true); return; }
      userIdRef.current = user.id;

      supabase
        .from("profiles")
        .select("elevenlabs_api_key, voice_profiles, active_voice_id")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            if (data.elevenlabs_api_key) setApiKey(data.elevenlabs_api_key);
            if (Array.isArray(data.voice_profiles) && data.voice_profiles.length > 0) {
              setProfiles(data.voice_profiles as VoiceProfile[]);
            }
            if (data.active_voice_id) setSelectedVoiceIdState(data.active_voice_id);
          }
          setReady(true);
        });
    });
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
    if (!selectedVoiceId || !apiKey) {
      webSpeak(text, opts);
      return;
    }
    _playElevenLabs(text, selectedVoiceId, opts);
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
    <VoiceContext.Provider value={{ profiles, selectedVoiceId, setSelectedVoiceId, tts, playWith, stop, ready }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  return useContext(VoiceContext);
}
