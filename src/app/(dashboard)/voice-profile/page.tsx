"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Plus, Trash2, Volume2, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak as webSpeak } from "@/lib/tts";
import { useVoice } from "@/lib/voice-context";

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
  const { refresh } = useVoice();

  // 현재 선택된 목소리 (UI 상태)
  const [activeVoiceId, setActiveVoiceId] = useState("__female__");
  // DB에 저장된 목소리 (저장 전까지는 로드된 값 유지)
  const [savedVoiceId, setSavedVoiceId] = useState("__female__");

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [profiles, setProfiles] = useState<VoiceProfile[]>(DEFAULT_PROFILES);

  // 목소리 전용 저장 상태
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  // API키+프로필 저장 상태
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // TTS 테스트
  const [testText, setTestText] = useState("안녕하세요! 저는 아장아장 AI 선생님이에요.");
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
          const vid = data.active_voice_id ?? "__female__";
          setActiveVoiceId(vid);
          setSavedVoiceId(vid);
          setVoiceSaved(true);
          if (Array.isArray(data.voice_profiles) && data.voice_profiles.length > 0) {
            setProfiles(data.voice_profiles as VoiceProfile[]);
          }
        });
    });
  }, []);

  // 목소리 변경 시 저장 완료 표시 해제
  function selectVoice(id: string) {
    setActiveVoiceId(id);
    setVoiceSaved(id === savedVoiceId);
  }

  // 목소리만 저장
  async function handleSaveVoice() {
    setVoiceSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인 필요");
      const { error } = await supabase
        .from("profiles")
        .update({ active_voice_id: activeVoiceId })
        .eq("id", user.id);
      if (error) throw new Error(error.message ?? JSON.stringify(error));
      setSavedVoiceId(activeVoiceId);
      setVoiceSaved(true);
      await refresh();
    } catch (err) {
      alert(`저장 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setVoiceSaving(false);
    }
  }

  function updateProfile(id: string, field: keyof VoiceProfile, value: string) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
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

  // API키 + 프로필 저장
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인 필요");
      const { error } = await supabase
        .from("profiles")
        .update({ elevenlabs_api_key: apiKey || null, voice_profiles: profiles })
        .eq("id", user.id);
      if (error) throw new Error(error.message ?? JSON.stringify(error));
      setSaved(true);
      await refresh();
    } catch (err) {
      alert(`저장 실패:\n${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testText.trim()) return;
    if (activeVoiceId === "__female__") { webSpeak(testText, { lang: "ko", gender: "female" }); return; }
    if (activeVoiceId === "__male__") { webSpeak(testText, { lang: "ko", gender: "male" }); return; }
    if (!apiKey) { alert("ElevenLabs API 키를 입력하고 저장해주세요."); return; }
    setTestLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText, voice_id: activeVoiceId, api_key: apiKey }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error ?? `오류 ${res.status}`); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (testAudioRef.current) { testAudioRef.current.pause(); URL.revokeObjectURL(testAudioRef.current.src); }
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
  const activeProfile = profiles.find((p) => p.voice_id === activeVoiceId);
  const voiceChanged = activeVoiceId !== savedVoiceId;

  function voiceLabel(id: string) {
    if (id === "__female__") return "👩 기본 목소리 1";
    if (id === "__male__") return "👨 기본 목소리 2";
    return profiles.find((p) => p.voice_id === id)?.name ?? id;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "#BE185D" }}>🎙️ 목소리 설정</h1>
        <p className="text-sm text-gray-500 mt-1">목소리를 선택하고 저장하면 앱 전체에 적용됩니다.</p>
      </div>

      {/* ── 섹션 1: 목소리 선택 + 저장 ── */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #FBCFE8", boxShadow: "0 4px 24px rgba(236,72,153,0.08)" }}
      >
        <div>
          <h2 className="font-black text-lg" style={{ color: "#BE185D" }}>🎵 목소리 선택</h2>
          <p className="text-xs text-gray-400 mt-0.5">선택 후 반드시 <strong>저장</strong> 버튼을 눌러주세요</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => selectVoice("__female__")}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: activeVoiceId === "__female__" ? "linear-gradient(135deg, #EC4899, #BE185D)" : "white",
              color: activeVoiceId === "__female__" ? "white" : "#BE185D",
              border: `2px solid ${activeVoiceId === "__female__" ? "#EC4899" : "#FBCFE8"}`,
            }}
          >
            👩 기본 목소리 1
          </button>

          <button
            type="button"
            onClick={() => selectVoice("__male__")}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: activeVoiceId === "__male__" ? "linear-gradient(135deg, #3B82F6, #1D4ED8)" : "white",
              color: activeVoiceId === "__male__" ? "white" : "#1D4ED8",
              border: `2px solid ${activeVoiceId === "__male__" ? "#3B82F6" : "#BFDBFE"}`,
            }}
          >
            👨 기본 목소리 2
          </button>

          {apiKey && validProfiles.map((p) => {
            const isSelected = p.voice_id === activeVoiceId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectVoice(p.voice_id)}
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

        {/* 저장 상태 표시 */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            {voiceSaved && !voiceChanged
              ? <span style={{ color: "#10B981" }}>✅ 저장됨 — {voiceLabel(savedVoiceId)}</span>
              : <span style={{ color: "#F59E0B" }}>⚠️ 미저장 — {voiceLabel(activeVoiceId)} 선택됨</span>
            }
          </p>

          <button
            type="button"
            onClick={handleSaveVoice}
            disabled={voiceSaving || (!voiceChanged && voiceSaved)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black transition-all disabled:opacity-40"
            style={{
              background: (!voiceChanged && voiceSaved)
                ? "#D1FAE5"
                : "linear-gradient(135deg, #EC4899, #C026D3)",
              color: (!voiceChanged && voiceSaved) ? "#065F46" : "white",
              border: "none",
            }}
          >
            {voiceSaving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 저장 중</>
            ) : (!voiceChanged && voiceSaved) ? (
              <><CheckCircle className="w-3.5 h-3.5" /> 저장됨</>
            ) : (
              "💾 저장하기"
            )}
          </button>
        </div>
      </div>

      {/* ── 섹션 2: ElevenLabs API 키 ── */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #FBCFE8", boxShadow: "0 4px 24px rgba(236,72,153,0.08)" }}
      >
        <h2 className="font-black text-lg" style={{ color: "#BE185D" }}>🔑 ElevenLabs API 키</h2>
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

      {/* ── 섹션 3: 나만의 목소리 ── */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #FBCFE8", boxShadow: "0 4px 24px rgba(236,72,153,0.08)" }}
      >
        <div>
          <h2 className="font-black text-lg" style={{ color: "#BE185D" }}>🎵 나만의 목소리</h2>
          <p className="text-xs text-gray-400 mt-0.5">ElevenLabs Voice ID를 등록하세요</p>
        </div>
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-xl p-4 space-y-3"
              style={{ border: "1.5px solid #FCE7F3", background: "#FAFAFF" }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateProfile(profile.id, "name", e.target.value)}
                  placeholder="목소리 이름 (예: 엄마 목소리)"
                  className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none"
                  style={{ border: "1.5px solid #FCE7F3", background: "white", color: "#374151" }}
                />
                <button
                  type="button"
                  onClick={() => removeProfile(profile.id)}
                  className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold" style={{ color: "#EC4899" }}>Voice ID</label>
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
          ))}
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

      {/* ── API키+프로필 저장 버튼 ── */}
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
          "💾 API키 · 목소리 목록 저장"
        )}
      </Button>

      {/* ── 섹션 5: TTS 테스트 ── */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{ background: "white", border: "2px solid #E9D5FF", boxShadow: "0 4px 24px rgba(168,85,247,0.08)" }}
      >
        <div>
          <h2 className="font-black text-lg" style={{ color: "#7C3AED" }}>🔊 목소리 테스트</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            현재 선택:{" "}
            <span className="font-semibold" style={{ color: "#7C3AED" }}>{voiceLabel(activeVoiceId)}</span>
          </p>
        </div>
        {(activeVoiceId === "__female__" || activeVoiceId === "__male__") && (
          <p className="text-xs" style={{ color: "#9CA3AF" }}>기기 내장 목소리로 재생됩니다 (ElevenLabs 미사용)</p>
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
          disabled={testLoading || !testText.trim()}
          className="w-full"
          style={{
            background: activeVoiceId === "__female__"
              ? "linear-gradient(135deg, #EC4899, #BE185D)"
              : activeVoiceId === "__male__"
              ? "linear-gradient(135deg, #3B82F6, #1D4ED8)"
              : "linear-gradient(135deg, #8B5CF6, #7C3AED)",
            color: "white",
          }}
        >
          {testLoading ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> 생성 중...</>
          ) : (
            <><Volume2 className="w-4 h-4 mr-1" />{voiceLabel(activeVoiceId)}로 테스트</>
          )}
        </Button>
      </div>

      {/* ── 섹션 6: 가이드 ── */}
      <div
        className="rounded-2xl p-5 space-y-4 text-sm"
        style={{ background: "white", border: "2px solid #FBCFE8", boxShadow: "0 4px 24px rgba(236,72,153,0.06)" }}
      >
        <div>
          <p className="font-black text-base" style={{ color: "#BE185D" }}>✨ 내 목소리로 들려주고 싶다면?</p>
          <p className="text-xs text-gray-400 mt-1">ElevenLabs AI 목소리 클로닝을 사용하면 엄마·아빠 목소리로 동화를 읽어줄 수 있어요.</p>
        </div>
        <div className="space-y-3">
          {[
            { step: "1", title: "ElevenLabs 가입", desc: "elevenlabs.io에 접속해 무료 계정을 만드세요. 매달 10,000자까지 무료로 사용할 수 있어요.", color: "#EC4899" },
            { step: "2", title: "내 목소리 녹음", desc: "Voices → Add a new voice → Instant Voice Cloning을 선택해요. 1~3분 분량의 목소리를 녹음하거나 파일을 업로드하면 AI가 목소리를 학습해요.", color: "#A855F7" },
            { step: "3", title: "Voice ID 복사", desc: "Voices 목록에서 방금 만든 목소리 옆 ··· 버튼 → \"Copy Voice ID\"를 클릭하세요.", color: "#6366F1" },
            { step: "4", title: "API 키 발급", desc: "오른쪽 상단 프로필 아이콘 → API Keys → API 키 복사. 위 ElevenLabs API 키 칸에 붙여넣어요.", color: "#0EA5E9" },
            { step: "5", title: "저장 후 완료!", desc: "목소리 선택 후 💾 저장하기, API키 입력 후 💾 API키·목소리 목록 저장을 누르면 앱 전체에 적용됩니다.", color: "#10B981" },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black mt-0.5" style={{ background: color }}>
                {step}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color }}>{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "#FFF5FB", border: "1.5px solid #FCE7F3" }}>
          <p className="font-semibold" style={{ color: "#EC4899" }}>📌 참고</p>
          <p className="text-gray-500">한국어 지원 모델 <code className="bg-pink-50 px-1 rounded">eleven_multilingual_v2</code> 자동 사용</p>
        </div>
      </div>
    </div>
  );
}
