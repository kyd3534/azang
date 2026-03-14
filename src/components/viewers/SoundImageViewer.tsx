"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SpeakButton from "@/components/ui/SpeakButton";
import type { SoundImageOutput } from "@/ai/flows/english";

interface Props { data: SoundImageOutput; }

export default function SoundImageViewer({ data }: Props) {
  const [current, setCurrent] = useState(0);
  const word = data.words[current];

  return (
    <div className="max-w-md mx-auto">
      {/* 진행 표시 */}
      <div className="flex justify-center gap-2 mb-6">
        {data.words.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="w-3 h-3 rounded-full transition-all"
            style={{ background: i === current ? "#FF69B4" : "#FBCFE8" }}
          />
        ))}
      </div>

      {/* 메인 카드 */}
      <motion.div
        key={current}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-3xl p-8 text-center shadow-lg mb-6"
        style={{ background: "linear-gradient(135deg, #FFF0F8, #F0F0FF)" }}
      >
        <div className="text-8xl mb-4">{word.emoji}</div>
        <div className="text-5xl font-black mb-3" style={{ color: "#FF69B4" }}>
          {word.word}
        </div>
        {word.rhyme_hint && (
          <div className="text-sm font-medium mb-3" style={{ color: "#C084FC" }}>
            🎵 {word.rhyme_hint}
          </div>
        )}
        <SpeakButton
          text={word.tts_text}
          lang="en"
          className="mx-auto mt-2 px-6 py-3 rounded-2xl font-black text-white text-lg"
          style={{ background: "linear-gradient(135deg, #FF85C1, #C778E8)" }}
          iconSize={20}
        />
      </motion.div>

      {/* 이전/다음 */}
      <div className="flex gap-3 justify-center mb-6">
        <button
          onClick={() => setCurrent((p) => Math.max(0, p - 1))}
          disabled={current === 0}
          className="px-5 py-2 rounded-2xl font-bold text-sm transition-all disabled:opacity-30"
          style={{ background: "#FCE7F3", color: "#BE185D" }}
        >
          ◀ 이전
        </button>
        <button
          onClick={() => setCurrent((p) => Math.min(data.words.length - 1, p + 1))}
          disabled={current === data.words.length - 1}
          className="px-5 py-2 rounded-2xl font-bold text-sm transition-all disabled:opacity-30"
          style={{ background: "#FCE7F3", color: "#BE185D" }}
        >
          다음 ▶
        </button>
      </div>

      {/* 부모 팁 */}
      {data.parent_tip && (
        <div className="rounded-2xl px-4 py-3 text-sm font-medium"
          style={{ background: "#FFF9FB", border: "1.5px dashed #FBCFE8", color: "#9D174D" }}>
          💡 <strong>부모 팁:</strong> {data.parent_tip}
        </div>
      )}
    </div>
  );
}
