"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { speak } from "@/lib/tts";
import { Button } from "@/components/ui/button";
import type { CountingOutput } from "@/ai/flows/numbers";

export default function CountingViewer({ data }: { data: CountingOutput }) {
  const [current, setCurrent] = useState(0);

  const card = data.items[current];
  if (!card) return null;

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-sm text-gray-400 mb-6">{current + 1} / {data.items.length}</p>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-8 text-center space-y-4">

          {/* 숫자 */}
          <div
            className="text-8xl font-black text-gray-800 cursor-pointer"
            onClick={() => speak(card.native, { lang: "ko" })}
          >
            {card.value}
          </div>

          {/* 이모지 배열 */}
          <div className="flex flex-wrap justify-center gap-1 min-h-[60px] items-center">
            {Array.from({ length: card.value }).map((_, i) => (
              <motion.span key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className="text-3xl">
                {card.emoji.split("").slice(0, 2).join("")}
              </motion.span>
            ))}
          </div>

          {/* 고유어 */}
          <div className="flex items-center justify-center gap-2">
            <p className="text-2xl font-bold text-gray-600">{card.native}</p>
            <button onClick={() => speak(card.native, { lang: "ko", rate: 0.8 })}
              className="text-gray-300 hover:text-gray-500">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* 노래 가사 */}
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-sm text-purple-600 font-medium">{card.song}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5">
          {data.items.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={() => setCurrent((p) => Math.min(data.items.length - 1, p + 1))} disabled={current === data.items.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
