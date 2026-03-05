"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { speak } from "@/lib/tts";
import { Button } from "@/components/ui/button";
import type { SentencesOutput } from "@/ai/flows/english";

export default function SentencesViewer({ data }: { data: SentencesOutput }) {
  const [current, setCurrent] = useState(0);
  const [showPractice, setShowPractice] = useState(false);

  const card = data.sentences[current];
  if (!card) return null;

  function goNext() { setShowPractice(false); setCurrent((p) => Math.min(data.sentences.length - 1, p + 1)); }
  function goPrev() { setShowPractice(false); setCurrent((p) => Math.max(0, p - 1)); }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-sm text-gray-400 mb-6">{current + 1} / {data.sentences.length}</p>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-6 space-y-4">

          <div className="text-4xl text-center">{card.emoji}</div>

          {/* 문장 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <p className="text-xl font-bold text-gray-800 break-words">{card.sentence}</p>
              <button onClick={() => speak(card.sentence, { lang: "en" })}
                className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500">{card.translation}</p>
          </div>

          {/* 패턴 */}
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-400 mb-1">문장 패턴</p>
            <p className="text-sm font-medium text-blue-700">{card.pattern}</p>
          </div>

          {/* 연습 */}
          <div>
            <button onClick={() => setShowPractice((p) => !p)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
              {showPractice ? "연습 숨기기" : "빈칸 연습 해보기"}
            </button>
            {showPractice && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="mt-2 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-600">{card.practice}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={goPrev} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5">
          {data.sentences.map((_, i) => (
            <button key={i} onClick={() => { setShowPractice(false); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={goNext} disabled={current === data.sentences.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
