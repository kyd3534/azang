"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

interface HangulCard {
  char: string;
  pronunciation: string;
  example: string;
  emoji: string;
}

interface HangulViewerProps {
  title: string;
  characters: HangulCard[];
}

export default function HangulViewer({ title, characters }: HangulViewerProps) {
  const [current, setCurrent] = useState(0);

  function handleSpeak(text: string) {
    speak(text, { lang: "ko", rate: 0.8 });
  }

  const card = characters[current];
  if (!card) return null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2 break-words">{title}</h1>
      <p className="text-center text-sm text-gray-400 mb-6">{current + 1} / {characters.length}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-8 text-center min-h-[260px] flex flex-col items-center justify-center"
        >
          {/* 큰 글자 */}
          <div
            className="text-8xl font-bold text-gray-800 mb-4 cursor-pointer select-none"
            onClick={() => handleSpeak(card.char)}
          >
            {card.char}
          </div>

          {/* 발음 */}
          <div className="text-lg text-gray-500 mb-3">{card.pronunciation}</div>

          {/* 예시 */}
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-2xl">{card.emoji}</span>
            <span className="font-medium">{card.example}</span>
          </div>

          <button
            onClick={() => handleSpeak(card.example)}
            className="mt-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={() => setCurrent((p) => Math.max(0, p - 1))} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5">
          {characters.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={() => setCurrent((p) => Math.min(characters.length - 1, p + 1))} disabled={current === characters.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
