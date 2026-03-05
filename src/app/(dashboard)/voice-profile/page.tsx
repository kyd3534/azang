"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Plus, Trash2, Volume2, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceProfile {
  id: string;
  name: string;
  voice_id: string;
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_PROFILES: VoiceProfile[] = [
  { id: randomId(), name: "엄마 목소리", voice_id: "" },
  { id: randomId(), name: "아빠 목소리", voice_id: "" },
];

export default function VoiceProfilePage() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [profiles, setProfiles] = useState<VoiceProfile[]>(DEFAULT_PROFILES);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // TTS 테스트
  const [testText, setTestText] = useState("안녕하세요! 저는 아장아장 AI 선생님이에요.");
  const [testVoiceId, setTestVoiceId] = useState(""); // 테스트용 선택
  const [testLoading, setTestLoading] = useState(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // 마운트 시 저장된 설정 불러오기
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("elevenlabs_api_key, voice_profiles, active_voice_id")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) return;

          if (data.elevenlabs_api_key) setApiKey(data.elevenlabs_api_key);
          if (data.active_voice_id) {
            setTestVoiceId(data.active_voice_id);
          }
          if (Array.isArray(data.voice_profiles) && data.voice_profiles.length > 0) {
            setProfiles(data.voice_profiles as VoiceProfile[]);
          }
        });
    });
  }, []);

  function updateProfile(id: string, field: keyof VoiceProfile, value: string) {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
    setSaved(false);
  }

  function addProfile() {
    setProfiles((prev) => [...prev, { id: randomId(), name: "", voice_id: "" }]);
    setSaved(false);
  }

  function removeProfile(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인 필요");

      const { error } = await supabase
        .from("profiles")
        .update({
          elevenlabs_api_key: apiKey || null,
          voice_profiles: profiles,
        })
        .eq("id", user.id);

      if (error) {
        const msg = (error as { message?: string; details?: string; hint?: string }).message
          || (error as { details?: string }).details
          || JSON.stringify(error);
        throw new Error(msg);
      }
      setSaved(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      alert(`저장 실패:\n${msg}\n\n→ Supabase SQL Editor에서 elevenlabs-migration.sql을 실행했는지 확인하세요.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!apiKey) {
      alert("ElevenLabs API 키를 입력하고 저장해주세요.");
      return;
    }
    if (!testVoiceId) {
      alert("테스트할 목소리를 선택해주세요.");
      return;
    }
    if (!testText.trim()) return;
    setTestLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText, voice_id: testVoiceId, api_key: apiKey }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `오류 ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        URL.revokeObjectURL(testAudioRef.current.src);
      }
      testAudioRef.current = new Audio(url);
      testAudioRef.current.onended = () => URL.revokeObjectURL(url);
      testAudioRef.current.play();
    } catch (err) {
      alert(`TTS 생성 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestLoading(false);
    }
  }

  const validProfiles = profiles.filter((p) => p.voice_id);
  const testProfile = profiles.find((p) => p.voice_id === testVoiceId);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#BE185D" }}>
          🎙️ 목소리 설정
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          목소리를 등록하고 앱 전체에서 사용할 목소리를 선택하세요.
        </p>
      </div>

      {/* 섹션 1 — API 키 */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #FBCFE8", boxShadow: "0 4px 24px rgba(236,72,153,0.08)" }}
      >
        <h2 className="font-black text-lg" style={{ color: "#BE185D" }}>
          🔑 ElevenLabs API 키
        </h2>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
            placeholder="ElevenLabs API 키를 입력하세요"
            autoComplete="off"
            className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none"
            style={{ border: "1.5px solid #FBCFE8", background: "#FFF5FB", color: "#374151" }}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          <a href="https://elevenlabs.io/app/speech-synthesis" target="_blank" rel="noreferrer"
            className="underline" style={{ color: "#EC4899" }}>elevenlabs.io</a>
          {" "}→ 프로필 → API Keys에서 발급 (무료 10,000자/월)
        </p>
      </div>

      {/* 섹션 2 — 목소리 목록 */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #FBCFE8", boxShadow: "0 4px 24px rgba(236,72,153,0.08)" }}
      >
        <div>
          <h2 className="font-black text-lg" style={{ color: "#BE185D" }}>🎵 목소리 목록</h2>
          <p className="text-xs text-gray-400 mt-0.5">목소리를 등록한 후 상단 내비게이션에서 선택하세요</p>
        </div>

        <div className="space-y-3">
          {profiles.map((profile) => {
            return (
              <div
                key={profile.id}
                className="rounded-xl p-4 space-y-3 transition-all"
                style={{
                  border: "1.5px solid #FCE7F3",
                  background: "#FAFAFF",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* 이름 입력 */}
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfile(profile.id, "name", e.target.value)}
                    placeholder="목소리 이름 (예: 엄마 목소리)"
                    className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none"
                    style={{ border: "1.5px solid #FCE7F3", background: "white", color: "#374151" }}
                  />

                  {/* 삭제 */}
                  <button
                    type="button"
                    onClick={() => removeProfile(profile.id)}
                    className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Voice ID 입력 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold" style={{ color: "#EC4899" }}>
                    Voice ID
                  </label>
                  <input
                    type="text"
                    value={profile.voice_id}
                    onChange={(e) => updateProfile(profile.id, "voice_id", e.target.value)}
                    placeholder="예: 21m00Tcm4TlvDq8ikWAM"
                    autoComplete="off"
                    className="w-full rounded-lg px-3 py-1.5 text-xs font-mono outline-none"
                    style={{ border: "1.5px solid #FCE7F3", background: "white", color: "#6B7280" }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addProfile}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-pink-50"
          style={{ border: "2px dashed #FBCFE8", color: "#EC4899" }}
        >
          <Plus className="w-4 h-4" /> 목소리 추가
        </button>
      </div>

      {/* 섹션 3 — 저장 버튼 */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full text-base font-black py-6"
        style={{ background: "linear-gradient(135deg, #EC4899, #C026D3)", color: "white" }}
      >
        {saving ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 저장 중...</>
        ) : saved ? (
          <><CheckCircle className="w-5 h-5 mr-2" /> 저장 완료!</>
        ) : (
          "💾 설정 저장"
        )}
      </Button>

      {/* 섹션 4 — TTS 테스트 */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #E9D5FF", boxShadow: "0 4px 24px rgba(168,85,247,0.08)" }}
      >
        <div>
          <h2 className="font-black text-lg" style={{ color: "#7C3AED" }}>🔊 목소리 테스트</h2>
          <p className="text-xs text-gray-400 mt-0.5">어떤 목소리로 테스트할지 선택하세요</p>
        </div>

        {/* 테스트 목소리 선택 */}
        {validProfiles.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {validProfiles.map((p) => {
              const isSelected = p.voice_id === testVoiceId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTestVoiceId(p.voice_id)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: isSelected ? "linear-gradient(135deg, #8B5CF6, #7C3AED)" : "white",
                    color: isSelected ? "white" : "#7C3AED",
                    border: `2px solid ${isSelected ? "#8B5CF6" : "#E9D5FF"}`,
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-red-400">Voice ID가 입력된 목소리가 없습니다.</p>
        )}

        {testProfile && (
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            테스트 목소리: <span className="font-semibold" style={{ color: "#7C3AED" }}>{testProfile.name}</span>
          </p>
        )}

        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
          style={{ border: "1.5px solid #E9D5FF", background: "#FAFAFF", color: "#374151" }}
          placeholder="읽을 텍스트를 입력하세요..."
        />
        <Button
          onClick={handleTest}
          disabled={testLoading || !testText.trim() || !testVoiceId}
          className="w-full"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", color: "white" }}
        >
          {testLoading ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> 생성 중...</>
          ) : (
            <><Volume2 className="w-4 h-4 mr-1" />
              {testProfile ? `${testProfile.name}으로 읽기` : "목소리 선택 후 테스트"}</>
          )}
        </Button>
      </div>

      {/* Voice ID 찾는 방법 */}
      <div
        className="rounded-xl p-4 text-xs space-y-1.5"
        style={{ background: "#FFF5FB", border: "1.5px solid #FCE7F3", color: "#9CA3AF" }}
      >
        <p className="font-semibold" style={{ color: "#EC4899" }}>📌 Voice ID 찾는 방법</p>
        <p>1. <a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noreferrer"
          className="underline" style={{ color: "#EC4899" }}>elevenlabs.io/app/voice-library</a>에서 목소리 선택</p>
        <p>2. 목소리 옆 더보기(···) → "Copy Voice ID" 클릭</p>
        <p className="pt-1">한국어 지원 모델 <code className="bg-pink-50 px-1 rounded">eleven_multilingual_v2</code> 자동 사용</p>
      </div>
    </div>
  );
}
