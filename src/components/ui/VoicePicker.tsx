"use client";

import { useVoice } from "@/lib/voice-context";

interface Props {
  className?: string;
}

export default function VoicePicker({ className = "" }: Props) {
  const { profiles, selectedVoiceId, setSelectedVoiceId, ready } = useVoice();

  if (!ready) return null;

  const validProfiles = profiles.filter((p) => p.voice_id);
  // ElevenLabs 목소리가 없으면 표시 안 함
  if (validProfiles.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      <span className="text-xs text-gray-400 mr-0.5">🔊</span>

      {/* 기본 목소리 */}
      <button
        onClick={() => setSelectedVoiceId("")}
        className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
        style={{
          background: !selectedVoiceId ? "#6B7280" : "white",
          color: !selectedVoiceId ? "white" : "#9CA3AF",
          border: `1.5px solid ${!selectedVoiceId ? "#6B7280" : "#E5E7EB"}`,
        }}
      >
        기본
      </button>

      {/* ElevenLabs 목소리들 */}
      {validProfiles.map((p) => (
        <button
          key={p.id}
          onClick={() => setSelectedVoiceId(p.voice_id)}
          className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
          style={{
            background: selectedVoiceId === p.voice_id ? "#EC4899" : "white",
            color: selectedVoiceId === p.voice_id ? "white" : "#EC4899",
            border: `1.5px solid ${selectedVoiceId === p.voice_id ? "#EC4899" : "#FBCFE8"}`,
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
