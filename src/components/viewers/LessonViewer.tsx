"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SpeakButton from "@/components/ui/SpeakButton";

interface WordCard {
  word: string;
  pronunciation: string;
  meaning: string;
  emoji: string;
  exampleSentence: string;
  exampleTranslation: string;
}

interface LessonViewerProps {
  title: string;
  words: WordCard[];
}

export default function LessonViewer({ title, words }: LessonViewerProps) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  function goNext() {
    setFlipped(false);
    setTimeout(() => setCurrent((p) => Math.min(words.length - 1, p + 1)), 100);
  }

  function goPrev() {
    setFlipped(false);
    setTimeout(() => setCurrent((p) => Math.max(0, p - 1)), 100);
  }

  const card = words[current];
  if (!card) return null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 text-center mb-2 break-words">{title}</h1>
      <p className="text-center text-sm text-gray-400 mb-6">{current + 1} / {words.length}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="rounded-2xl bg-white shadow-notion hover:shadow-notion-hover transition-all duration-200 p-8 cursor-pointer select-none min-h-[240px] flex flex-col items-center justify-center text-center"
            onClick={() => setFlipped((f) => !f)}
          >
            {!flipped ? (
              <>
                <div className="text-5xl mb-4">{card.emoji}</div>
                <div className="text-3xl font-bold text-gray-800 mb-2">{card.word}</div>
                <div className="text-gray-400 text-sm">{card.pronunciation}</div>
                <SpeakButton
                  text={card.word}
                  lang="en"
                  className="mt-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                  iconSize={20}
                />
                <p className="text-xs text-gray-300 mt-3">탭하면 뜻을 볼 수 있어요</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-800 mb-3">{card.meaning}</div>
                <div className="text-sm text-gray-500 italic mb-1">{card.exampleSentence}</div>
                <div className="text-sm text-gray-400">{card.exampleTranslation}</div>
                <SpeakButton
                  text={card.exampleSentence}
                  lang="en"
                  className="mt-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                  iconSize={20}
                />
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={goPrev} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5">
          {words.map((_, i) => (
            <button key={i} onClick={() => { setFlipped(false); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={goNext} disabled={current === words.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
