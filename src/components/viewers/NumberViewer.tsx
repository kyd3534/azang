"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

interface NumberCard {
  value: number;
  korean: string;
  native: string;
  english: string;
  emoji: string;
  funFact: string;
}

interface NumberViewerProps {
  title: string;
  numbers: NumberCard[];
}

export default function NumberViewer({ title, numbers }: NumberViewerProps) {
  const [current, setCurrent] = useState(0);

  function handleSpeak(text: string, lang: "ko" | "en" = "ko") {
    speak(text, { lang });
  }

  const card = numbers[current];
  if (!card) return null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2 break-words">{title}</h1>
      <p className="text-center text-sm text-gray-400 mb-6">{current + 1} / {numbers.length}</p>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-8 text-center">

          {/* 숫자 */}
          <div className="text-7xl font-black text-gray-800 mb-2">{card.value}</div>

          {/* 이모지 */}
          <div className="text-3xl mb-4">{card.emoji}</div>

          {/* 3가지 표현 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSpeak(card.korean, "ko")}>
              <div className="text-xs text-gray-400 mb-1">한자어</div>
              <div className="font-bold text-gray-700">{card.korean}</div>
              <Volume2 className="w-3 h-3 text-gray-300 mx-auto mt-1" />
            </div>
            <div className="rounded-xl bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSpeak(card.native, "ko")}>
              <div className="text-xs text-gray-400 mb-1">고유어</div>
              <div className="font-bold text-gray-700">{card.native}</div>
              <Volume2 className="w-3 h-3 text-gray-300 mx-auto mt-1" />
            </div>
            <div className="rounded-xl bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => handleSpeak(card.english, "en")}>
              <div className="text-xs text-gray-400 mb-1">영어</div>
              <div className="font-bold text-gray-700">{card.english}</div>
              <Volume2 className="w-3 h-3 text-gray-300 mx-auto mt-1" />
            </div>
          </div>

          {/* 재미있는 이야기 */}
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 break-words">{card.funFact}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5">
          {numbers.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={() => setCurrent((p) => Math.min(numbers.length - 1, p + 1))} disabled={current === numbers.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
