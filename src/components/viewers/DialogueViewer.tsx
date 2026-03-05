"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { speak } from "@/lib/tts";
import type { DialogueOutput } from "@/ai/flows/english";

export default function DialogueViewer({ data }: { data: DialogueOutput }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  function toggleReveal(i: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="rounded-xl bg-white shadow-notion p-4">
        <p className="text-xs text-gray-400 mb-1">상황</p>
        <p className="text-sm text-gray-600 font-medium">{data.situation}</p>
      </div>

      {/* 대화 */}
      <div className="space-y-3">
        {data.lines.map((line, i) => {
          const isA = line.speaker === "A";
          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: isA ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex gap-3 ${isA ? "justify-start" : "justify-end"}`}>

              {isA && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                  {line.speakerName[0]}
                </div>
              )}

              <div className={`max-w-[75%] ${isA ? "" : "items-end"} flex flex-col gap-1`}>
                <span className="text-xs text-gray-400">{line.speakerName}</span>
                <div
                  className={`rounded-2xl px-4 py-2.5 cursor-pointer ${
                    isA ? "bg-white shadow-notion rounded-tl-none" : "bg-gray-800 text-white rounded-tr-none"
                  }`}
                  onClick={() => toggleReveal(i)}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium break-words">{line.text}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); speak(line.text, { lang: "en" }); }}
                      className={`shrink-0 ${isA ? "text-gray-400 hover:text-gray-600" : "text-gray-300 hover:text-white"}`}>
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {revealed.has(i) && (
                    <p className={`text-xs mt-1 ${isA ? "text-gray-400" : "text-gray-300"}`}>
                      {line.translation}
                    </p>
                  )}
                </div>
                {!revealed.has(i) && (
                  <p className="text-xs text-gray-300 px-1">탭하면 번역이 보여요</p>
                )}
              </div>

              {!isA && (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                  {line.speakerName[0]}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 핵심 어휘 */}
      {data.vocabulary.length > 0 && (
        <div className="rounded-xl bg-white shadow-notion p-4">
          <p className="text-xs text-gray-400 mb-3">핵심 단어</p>
          <div className="flex flex-wrap gap-2">
            {data.vocabulary.map((v, i) => (
              <button key={i}
                onClick={() => speak(v.word, { lang: "en" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                <span className="text-sm font-medium text-gray-700">{v.word}</span>
                <span className="text-xs text-gray-400">{v.meaning}</span>
                <Volume2 className="w-3 h-3 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
