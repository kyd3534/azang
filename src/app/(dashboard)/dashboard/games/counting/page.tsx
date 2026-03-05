"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const ITEMS = ["🍎", "🌟", "🐱", "🎈", "🦋", "🍭", "🐸", "🚗"];

function generateQuestion() {
  const emoji = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  const count = Math.floor(Math.random() * 9) + 1;
  const choices = new Set([count]);
  while (choices.size < 4) choices.add(Math.floor(Math.random() * 9) + 1);
  return {
    emoji,
    count,
    choices: [...choices].sort(() => Math.random() - 0.5),
  };
}

const NUMBER_KO = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];

const CORRECT_COMMENTS = ["잘했어요!", "훌륭해요!", "맞아요, 대단해요!", "완벽해요!", "최고예요!"];
const WRONG_COMMENTS = ["다시 해봐요!", "조금만 더 생각해봐요!", "괜찮아요, 한번 더!", "아쉬워요, 다시 세어봐요!"];

function speakKo(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ko-KR";
  utter.rate = 0.88;
  utter.pitch = 1.2;

  const voices = synth.getVoices();
  const koVoice = voices.find((v) => v.lang.startsWith("ko")) ?? null;
  if (koVoice) utter.voice = koVoice;

  const doSpeak = () => synth.speak(utter);
  if (synth.getVoices().length > 0) {
    doSpeak();
  } else {
    synth.addEventListener("voiceschanged", doSpeak, { once: true });
  }
}

export default function CountingGame() {
  const [question, setQuestion] = useState(generateQuestion);
  const [answered, setAnswered] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [comment, setComment] = useState<{ text: string; correct: boolean } | null>(null);

  const handleChoiceClick = useCallback((choice: number) => {
    if (answered !== null) return;
    setAnswered(choice);
    setTotal((t) => t + 1);

    const isCorrect = choice === question.count;
    if (isCorrect) {
      setScore((s) => s + 1);
      const msg = CORRECT_COMMENTS[Math.floor(Math.random() * CORRECT_COMMENTS.length)];
      setComment({ text: msg, correct: true });
      speakKo(`${NUMBER_KO[choice]}! ${msg}`);
    } else {
      const msg = WRONG_COMMENTS[Math.floor(Math.random() * WRONG_COMMENTS.length)];
      setComment({ text: msg, correct: false });
      speakKo(msg);
    }

    setTimeout(() => {
      setAnswered(null);
      setComment(null);
      setQuestion(generateQuestion());
    }, 1800);
  }, [answered, question.count]);

  // 이모지 클릭 시 숫자 읽어주기
  const handleEmojiClick = useCallback(() => {
    speakKo(`${question.count}개! ${NUMBER_KO[question.count]}!`);
  }, [question.count]);

  return (
    <div>
      <PageHeader title="숫자 세기" emoji="🔢" backHref="/dashboard/games" />

      <div className="flex items-center justify-between mb-5 max-w-sm">
        <span className="text-sm text-gray-500">점수: <b>{score}/{total}</b></span>
        <Button variant="outline" size="sm" onClick={() => { setScore(0); setTotal(0); setQuestion(generateQuestion()); }}>
          초기화
        </Button>
      </div>

      <div className="max-w-sm space-y-6">
        {/* 이모지 그리드 — 클릭하면 숫자 읽기 */}
        <AnimatePresence mode="wait">
          <motion.div key={`${question.emoji}-${question.count}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={handleEmojiClick}
            className="rounded-2xl bg-white shadow-notion p-6 cursor-pointer select-none active:scale-[0.98] transition-transform"
          >
            <p className="text-sm text-gray-400 text-center mb-1">몇 개인가요?</p>
            <p className="text-[10px] text-pink-300 text-center mb-4">👆 눌러서 세어보기</p>
            <div className="flex flex-wrap justify-center gap-2">
              {Array.from({ length: question.count }).map((_, i) => (
                <span key={i} className="text-3xl">{question.emoji}</span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 피드백 코멘트 */}
        <AnimatePresence>
          {comment && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="rounded-xl py-3 px-4 text-center font-black text-base"
              style={comment.correct
                ? { background: "#F0FDF4", border: "2px solid #86EFAC", color: "#15803D" }
                : { background: "#FFF1F2", border: "2px solid #FECDD3", color: "#BE123C" }
              }
            >
              {comment.correct ? "🌟 " : "💪 "}{comment.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 선택지 */}
        <div className="grid grid-cols-2 gap-3">
          {question.choices.map((choice) => {
            const isCorrect = choice === question.count;
            const isSelected = answered === choice;
            let cls = "rounded-xl py-4 text-2xl font-bold border-2 transition-all duration-200 ";
            if (answered !== null) {
              if (isCorrect) cls += "bg-green-50 border-green-400 text-green-700";
              else if (isSelected) cls += "bg-red-50 border-red-400 text-red-700";
              else cls += "bg-gray-50 border-gray-200 text-gray-300";
            } else {
              cls += "bg-white border-gray-200 hover:border-gray-400 hover:shadow-notion cursor-pointer";
            }
            return (
              <button key={choice} onClick={() => handleChoiceClick(choice)} className={cls}>
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
