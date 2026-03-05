"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { speak } from "@/lib/tts";
import { Button } from "@/components/ui/button";
import type { HangulSentencesOutput } from "@/ai/flows/hangul";

export default function HangulSentencesViewer({ data }: { data: HangulSentencesOutput }) {
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const card = data.sentences[current];
  if (!card) return null;

  function goNext() { setShowAnswer(false); setCurrent((p) => Math.min(data.sentences.length - 1, p + 1)); }
  function goPrev() { setShowAnswer(false); setCurrent((p) => Math.max(0, p - 1)); }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-center text-sm text-gray-400 mb-6">{current + 1} / {data.sentences.length}</p>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-6 space-y-4">

          <div className="text-4xl text-center">{card.emoji}</div>

          {/* 문장 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-2xl font-bold text-gray-800 break-words leading-snug">{card.sentence}</p>
              <button onClick={() => speak(card.sentence, { lang: "ko" })}
                className="text-gray-300 hover:text-gray-500 shrink-0">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 핵심 표현 */}
          <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
            <p className="text-xs text-yellow-600 mb-1">핵심 표현</p>
            <p className="text-sm font-semibold text-yellow-800">{card.highlight}</p>
          </div>

          {/* 이해 확인 질문 */}
          <div>
            <p className="text-sm text-gray-500 mb-2">💬 {card.question}</p>
            <button onClick={() => setShowAnswer((p) => !p)}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
              {showAnswer ? "설명 숨기기" : "설명 보기"}
            </button>
            {showAnswer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                {card.meaning}
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
            <button key={i} onClick={() => { setShowAnswer(false); setCurrent(i); }}
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
