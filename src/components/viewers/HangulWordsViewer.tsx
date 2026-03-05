"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { speak } from "@/lib/tts";
import { Button } from "@/components/ui/button";
import type { HangulWordsOutput } from "@/ai/flows/hangul";

export default function HangulWordsViewer({ data }: { data: HangulWordsOutput }) {
  const [current, setCurrent] = useState(0);

  const card = data.words[current];
  if (!card) return null;

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-sm text-gray-400 mb-6">{current + 1} / {data.words.length}</p>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-8 text-center">

          <div className="text-5xl mb-4">{card.emoji}</div>

          {/* 단어 (음절 분리) */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-4xl font-black text-gray-800">{card.word}</div>
            <button onClick={() => speak(card.word, { lang: "ko" })}
              className="text-gray-300 hover:text-gray-500 transition-colors">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* 음절 분리 */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {card.syllables.map((s, i) => (
              <span key={i}>
                <span
                  className="px-3 py-1.5 bg-gray-100 rounded-lg text-lg font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => speak(s, { lang: "ko", rate: 0.7 })}
                >
                  {s}
                </span>
                {i < card.syllables.length - 1 && <span className="text-gray-300 mx-1">·</span>}
              </span>
            ))}
          </div>

          {/* 뜻 */}
          <p className="text-gray-500 text-sm mb-3">{card.meaning}</p>

          {/* 예문 */}
          <div className="bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => speak(card.sentence, { lang: "ko" })}>
            <p className="text-sm text-gray-600">{card.sentence}</p>
            <Volume2 className="w-3 h-3 text-gray-300 mx-auto mt-1" />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5">
          {data.words.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={() => setCurrent((p) => Math.min(data.words.length - 1, p + 1))} disabled={current === data.words.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
