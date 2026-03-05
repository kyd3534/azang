"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { speak } from "@/lib/tts";
import { Button } from "@/components/ui/button";
import type { JamoOutput } from "@/ai/flows/hangul";

export default function JamoViewer({ data }: { data: JamoOutput }) {
  const [current, setCurrent] = useState(0);

  const card = data.items[current];
  if (!card) return null;

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
          {data.jamoType === "vowels" ? "모음" : "자음"}
        </span>
        <span className="text-xs text-gray-400">{current + 1} / {data.items.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-8 text-center">

          {/* 큰 자모 */}
          <div
            className="text-9xl font-black text-gray-800 mb-3 cursor-pointer select-none leading-none"
            onClick={() => speak(card.char, { lang: "ko", rate: 0.7 })}
          >
            {card.char}
          </div>

          {/* 이름 */}
          <p className="text-lg font-semibold text-gray-600 mb-1">{card.name}</p>

          {/* 소리 설명 */}
          <p className="text-sm text-gray-400 mb-4">{card.sound}</p>

          {/* 예시 */}
          <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl p-3">
            <span className="text-3xl">{card.emoji}</span>
            <div className="text-left">
              <p className="font-bold text-gray-700">{card.example}</p>
              <button onClick={() => speak(card.example, { lang: "ko" })}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-0.5">
                <Volume2 className="w-3 h-3" /> 들어보기
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5 flex-wrap justify-center max-w-[160px]">
          {data.items.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={() => setCurrent((p) => Math.min(data.items.length - 1, p + 1))} disabled={current === data.items.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
