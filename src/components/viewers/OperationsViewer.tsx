"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OperationsOutput } from "@/ai/flows/numbers";

export default function OperationsViewer({ data }: { data: OperationsOutput }) {
  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");

  const card = data.operations[current];
  if (!card) return null;

  const isCorrect = showAnswer && parseInt(userAnswer) === card.answer;

  function goNext() { setShowAnswer(false); setUserAnswer(""); setCurrent((p) => Math.min(data.operations.length - 1, p + 1)); }
  function goPrev() { setShowAnswer(false); setUserAnswer(""); setCurrent((p) => Math.max(0, p - 1)); }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
          {card.type === "addition" ? "➕ 덧셈" : "➖ 뺄셈"}
        </span>
        <span className="text-sm text-gray-400">{current + 1} / {data.operations.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={current}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white shadow-notion p-8 space-y-5">

          {/* 이모지 설명 */}
          <div className="text-center">
            <div className="text-4xl mb-2">{card.emoji}</div>
            <p className="text-sm text-gray-500">{card.explanation}</p>
          </div>

          {/* 수식 */}
          <div className="text-center">
            <p className="text-3xl font-black text-gray-800">{card.expression}</p>
          </div>

          {/* 답 입력 */}
          {!showAnswer ? (
            <div className="flex gap-3">
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="?"
                className="flex-1 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl py-3 focus:border-gray-400 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && userAnswer && setShowAnswer(true)}
              />
              <Button onClick={() => setShowAnswer(true)} disabled={!userAnswer} size="lg">
                확인
              </Button>
            </div>
          ) : (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className={`text-center p-4 rounded-xl ${isCorrect ? "bg-green-50" : "bg-red-50"}`}>
              {isCorrect ? (
                <p className="text-lg font-bold text-green-700">정답이에요! 🎉 = {card.answer}</p>
              ) : (
                <p className="text-lg font-bold text-red-600">아쉬워요! 정답은 {card.answer} 이에요 💪</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={goPrev} disabled={current === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> 이전
        </Button>
        <div className="flex gap-1.5">
          {data.operations.map((_, i) => (
            <button key={i} onClick={() => { setShowAnswer(false); setUserAnswer(""); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-gray-800 w-4" : "bg-gray-300"}`} />
          ))}
        </div>
        <Button variant="outline" onClick={goNext} disabled={current === data.operations.length - 1}>
          다음 <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
