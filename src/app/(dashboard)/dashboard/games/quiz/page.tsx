"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

const QUIZ_DATA = [
  { emoji: "🐶", answer: "강아지", choices: ["강아지", "고양이", "토끼", "곰"] },
  { emoji: "🍎", answer: "사과", choices: ["바나나", "사과", "포도", "딸기"] },
  { emoji: "🚗", answer: "자동차", choices: ["비행기", "배", "자동차", "기차"] },
  { emoji: "🌙", answer: "달", choices: ["별", "달", "해", "구름"] },
  { emoji: "🎈", answer: "풍선", choices: ["공", "풍선", "사탕", "꽃"] },
  { emoji: "🦋", answer: "나비", choices: ["나비", "잠자리", "벌", "개미"] },
  { emoji: "🍦", answer: "아이스크림", choices: ["케이크", "쿠키", "아이스크림", "사탕"] },
  { emoji: "⭐", answer: "별", choices: ["달", "해", "별", "구름"] },
];

const CORRECT_COMMENTS = ["정답이에요!", "맞아요, 대단해요!", "훌륭해요!", "완벽해요!", "최고예요!"];
const WRONG_COMMENTS_PREFIX = ["아쉬워요! 정답은", "틀렸어요! 정답은", "다시 해봐요! 정답은"];

function getRandomQuestion() {
  return QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)];
}

export default function QuizGame() {
  const [question, setQuestion] = useState(getRandomQuestion);
  const [answered, setAnswered] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [comment, setComment] = useState<{ text: string; correct: boolean } | null>(null);

  const handleAnswer = useCallback((choice: string) => {
    if (answered !== null) return;
    setAnswered(choice);
    setTotal((t) => t + 1);

    // 선택한 단어 먼저 읽고, 이후 피드백 음성
    speak(choice, { lang: "ko" });

    const isCorrect = choice === question.answer;
    if (isCorrect) {
      setScore((s) => s + 1);
      const msg = CORRECT_COMMENTS[Math.floor(Math.random() * CORRECT_COMMENTS.length)];
      setComment({ text: msg, correct: true });
      setTimeout(() => speak(msg, { lang: "ko" }), 500);
    } else {
      const prefix = WRONG_COMMENTS_PREFIX[Math.floor(Math.random() * WRONG_COMMENTS_PREFIX.length)];
      const msg = `${prefix} "${question.answer}"이에요`;
      setComment({ text: `${prefix} "${question.answer}"이에요`, correct: false });
      setTimeout(() => speak(`${prefix} ${question.answer}이에요`, { lang: "ko" }), 500);
    }

    setTimeout(() => {
      setAnswered(null);
      setComment(null);
      setQuestion(getRandomQuestion());
    }, 1800);
  }, [answered, question.answer]);

  return (
    <div>
      <PageHeader title="퀴즈 놀이" emoji="❓" backHref="/dashboard/games" />

      <div className="flex items-center justify-between mb-5 max-w-sm">
        <span className="text-sm text-gray-500">점수: <b>{score}/{total}</b></span>
        <Button variant="outline" size="sm" onClick={() => { setScore(0); setTotal(0); setComment(null); setQuestion(getRandomQuestion()); }}>
          초기화
        </Button>
      </div>

      <div className="max-w-sm space-y-5">
        {/* 이모지 문제 — 클릭하면 문제 읽기 */}
        <AnimatePresence mode="wait">
          <motion.div key={question.emoji}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => speak("이게 뭐예요?", { lang: "ko" })}
            className="rounded-2xl bg-white shadow-notion p-8 text-center cursor-pointer select-none active:scale-[0.97] transition-transform"
          >
            <p className="text-sm text-gray-400 mb-1">이게 뭐예요?</p>
            <p className="text-[10px] text-pink-300 mb-3">👆 눌러서 질문 듣기</p>
            <div className="text-8xl">{question.emoji}</div>
          </motion.div>
        </AnimatePresence>

        {/* 피드백 */}
        <AnimatePresence>
          {comment && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
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
            const isCorrect = choice === question.answer;
            const isSelected = answered === choice;
            let cls = "rounded-xl py-4 text-base font-semibold border-2 transition-all duration-200 ";
            if (answered !== null) {
              if (isCorrect) cls += "bg-green-50 border-green-400 text-green-700";
              else if (isSelected) cls += "bg-red-50 border-red-400 text-red-700";
              else cls += "bg-gray-50 border-gray-200 text-gray-300";
            } else {
              cls += "bg-white border-gray-200 hover:border-gray-400 hover:shadow-notion cursor-pointer";
            }
            return (
              <button key={choice} onClick={() => handleAnswer(choice)} className={cls}>
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
