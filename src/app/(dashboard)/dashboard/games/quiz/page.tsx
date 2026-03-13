"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/tts";

interface QuizItem {
  emoji: string;
  answer: string;
  choices: string[];
  category: string;
}

const QUIZ_DATA: QuizItem[] = [
  // ── 동물 ──
  { emoji: "🐶", answer: "강아지", choices: ["강아지", "고양이", "토끼", "여우"], category: "동물" },
  { emoji: "🐱", answer: "고양이", choices: ["강아지", "고양이", "호랑이", "사자"], category: "동물" },
  { emoji: "🐰", answer: "토끼", choices: ["다람쥐", "토끼", "햄스터", "쥐"], category: "동물" },
  { emoji: "🐻", answer: "곰", choices: ["곰", "돼지", "원숭이", "하마"], category: "동물" },
  { emoji: "🐘", answer: "코끼리", choices: ["코끼리", "하마", "코뿔소", "기린"], category: "동물" },
  { emoji: "🦁", answer: "사자", choices: ["사자", "호랑이", "표범", "치타"], category: "동물" },
  { emoji: "🐯", answer: "호랑이", choices: ["사자", "호랑이", "표범", "치타"], category: "동물" },
  { emoji: "🦒", answer: "기린", choices: ["기린", "낙타", "얼룩말", "코끼리"], category: "동물" },
  { emoji: "🐧", answer: "펭귄", choices: ["펭귄", "독수리", "앵무새", "오리"], category: "동물" },
  { emoji: "🦅", answer: "독수리", choices: ["독수리", "참새", "비둘기", "까마귀"], category: "동물" },
  { emoji: "🦈", answer: "상어", choices: ["상어", "고래", "돌고래", "문어"], category: "동물" },
  { emoji: "🐋", answer: "고래", choices: ["상어", "고래", "돌고래", "물개"], category: "동물" },
  { emoji: "🐷", answer: "돼지", choices: ["돼지", "소", "말", "당나귀"], category: "동물" },
  { emoji: "🐮", answer: "소", choices: ["소", "말", "돼지", "양"], category: "동물" },
  { emoji: "🐴", answer: "말", choices: ["말", "소", "당나귀", "염소"], category: "동물" },
  { emoji: "🦊", answer: "여우", choices: ["여우", "늑대", "너구리", "오소리"], category: "동물" },
  { emoji: "🐺", answer: "늑대", choices: ["여우", "늑대", "강아지", "하이에나"], category: "동물" },
  { emoji: "🐸", answer: "개구리", choices: ["개구리", "두꺼비", "도마뱀", "카멜레온"], category: "동물" },
  { emoji: "🐢", answer: "거북이", choices: ["거북이", "악어", "도마뱀", "이구아나"], category: "동물" },
  { emoji: "🐍", answer: "뱀", choices: ["뱀", "지렁이", "도마뱀", "이무기"], category: "동물" },
  { emoji: "🦜", answer: "앵무새", choices: ["앵무새", "비둘기", "까마귀", "참새"], category: "동물" },
  { emoji: "🦆", answer: "오리", choices: ["오리", "기러기", "두루미", "펠리컨"], category: "동물" },
  { emoji: "🐠", answer: "열대어", choices: ["열대어", "금붕어", "잉어", "가오리"], category: "동물" },
  { emoji: "🦋", answer: "나비", choices: ["나비", "잠자리", "벌", "나방"], category: "동물" },
  { emoji: "🐝", answer: "벌", choices: ["벌", "말벌", "파리", "모기"], category: "동물" },
  { emoji: "🦓", answer: "얼룩말", choices: ["얼룩말", "말", "당나귀", "기린"], category: "동물" },
  { emoji: "🦏", answer: "코뿔소", choices: ["코뿔소", "코끼리", "하마", "들소"], category: "동물" },
  { emoji: "🦘", answer: "캥거루", choices: ["캥거루", "코알라", "웜뱃", "오포섬"], category: "동물" },
  { emoji: "🐨", answer: "코알라", choices: ["코알라", "캥거루", "판다", "곰"], category: "동물" },
  { emoji: "🐼", answer: "판다", choices: ["판다", "곰", "코알라", "너구리"], category: "동물" },
  // ── 음식 ──
  { emoji: "🍎", answer: "사과", choices: ["사과", "배", "참외", "자두"], category: "음식" },
  { emoji: "🍊", answer: "귤", choices: ["귤", "오렌지", "레몬", "자몽"], category: "음식" },
  { emoji: "🍋", answer: "레몬", choices: ["레몬", "귤", "라임", "자몽"], category: "음식" },
  { emoji: "🍇", answer: "포도", choices: ["포도", "블루베리", "체리", "자두"], category: "음식" },
  { emoji: "🍓", answer: "딸기", choices: ["딸기", "앵두", "체리", "라즈베리"], category: "음식" },
  { emoji: "🍉", answer: "수박", choices: ["수박", "멜론", "참외", "호박"], category: "음식" },
  { emoji: "🍑", answer: "복숭아", choices: ["복숭아", "살구", "자두", "망고"], category: "음식" },
  { emoji: "🍍", answer: "파인애플", choices: ["파인애플", "코코넛", "수박", "멜론"], category: "음식" },
  { emoji: "🥝", answer: "키위", choices: ["키위", "무화과", "파파야", "망고"], category: "음식" },
  { emoji: "🍌", answer: "바나나", choices: ["바나나", "망고", "파인애플", "파파야"], category: "음식" },
  { emoji: "🍚", answer: "밥", choices: ["밥", "죽", "떡", "국수"], category: "음식" },
  { emoji: "🍜", answer: "라면", choices: ["라면", "국수", "스파게티", "우동"], category: "음식" },
  { emoji: "🍕", answer: "피자", choices: ["피자", "빵", "토스트", "샌드위치"], category: "음식" },
  { emoji: "🍔", answer: "햄버거", choices: ["햄버거", "핫도그", "샌드위치", "타코"], category: "음식" },
  { emoji: "🍟", answer: "감자튀김", choices: ["감자튀김", "고구마", "감자칩", "옥수수"], category: "음식" },
  { emoji: "🌮", answer: "타코", choices: ["타코", "부리토", "피자", "핫도그"], category: "음식" },
  { emoji: "🍦", answer: "아이스크림", choices: ["아이스크림", "요거트", "케이크", "푸딩"], category: "음식" },
  { emoji: "🎂", answer: "케이크", choices: ["케이크", "마카롱", "쿠키", "빵"], category: "음식" },
  { emoji: "🍪", answer: "쿠키", choices: ["쿠키", "비스킷", "마카롱", "도넛"], category: "음식" },
  { emoji: "🍩", answer: "도넛", choices: ["도넛", "베이글", "쿠키", "빵"], category: "음식" },
  { emoji: "🍫", answer: "초콜릿", choices: ["초콜릿", "사탕", "젤리", "캐러멜"], category: "음식" },
  { emoji: "🍭", answer: "막대사탕", choices: ["막대사탕", "사탕", "젤리", "캐러멜"], category: "음식" },
  { emoji: "🥛", answer: "우유", choices: ["우유", "두유", "요거트", "치즈"], category: "음식" },
  { emoji: "🍰", answer: "조각케이크", choices: ["조각케이크", "케이크", "타르트", "파이"], category: "음식" },
  { emoji: "🥕", answer: "당근", choices: ["당근", "고구마", "무", "파"], category: "음식" },
  { emoji: "🌽", answer: "옥수수", choices: ["옥수수", "감자", "고구마", "당근"], category: "음식" },
  { emoji: "🍄", answer: "버섯", choices: ["버섯", "양파", "마늘", "생강"], category: "음식" },
  // ── 탈것 ──
  { emoji: "🚗", answer: "자동차", choices: ["자동차", "버스", "트럭", "택시"], category: "탈것" },
  { emoji: "🚌", answer: "버스", choices: ["버스", "자동차", "트럭", "트램"], category: "탈것" },
  { emoji: "🚂", answer: "기차", choices: ["기차", "전철", "트램", "케이블카"], category: "탈것" },
  { emoji: "🚀", answer: "로켓", choices: ["로켓", "비행기", "헬리콥터", "우주선"], category: "탈것" },
  { emoji: "✈️", answer: "비행기", choices: ["비행기", "헬리콥터", "글라이더", "드론"], category: "탈것" },
  { emoji: "🚁", answer: "헬리콥터", choices: ["헬리콥터", "비행기", "드론", "열기구"], category: "탈것" },
  { emoji: "🚢", answer: "배", choices: ["배", "요트", "잠수함", "보트"], category: "탈것" },
  { emoji: "🚲", answer: "자전거", choices: ["자전거", "오토바이", "킥보드", "인라인스케이트"], category: "탈것" },
  { emoji: "🏍️", answer: "오토바이", choices: ["오토바이", "자전거", "킥보드", "스쿠터"], category: "탈것" },
  { emoji: "🚒", answer: "소방차", choices: ["소방차", "구급차", "경찰차", "트럭"], category: "탈것" },
  { emoji: "🚑", answer: "구급차", choices: ["구급차", "소방차", "경찰차", "앰뷸런스"], category: "탈것" },
  { emoji: "🛸", answer: "UFO", choices: ["UFO", "로켓", "드론", "비행선"], category: "탈것" },
  { emoji: "🚜", answer: "트랙터", choices: ["트랙터", "불도저", "크레인", "굴착기"], category: "탈것" },
  { emoji: "🏎️", answer: "경주차", choices: ["경주차", "자동차", "버스", "오토바이"], category: "탈것" },
  { emoji: "🚤", answer: "보트", choices: ["보트", "배", "요트", "카누"], category: "탈것" },
  // ── 자연 ──
  { emoji: "☀️", answer: "태양", choices: ["태양", "달", "별", "행성"], category: "자연" },
  { emoji: "🌙", answer: "달", choices: ["달", "별", "태양", "혜성"], category: "자연" },
  { emoji: "⭐", answer: "별", choices: ["별", "달", "태양", "행성"], category: "자연" },
  { emoji: "☁️", answer: "구름", choices: ["구름", "안개", "연기", "눈"], category: "자연" },
  { emoji: "🌈", answer: "무지개", choices: ["무지개", "노을", "오로라", "빛"], category: "자연" },
  { emoji: "⚡", answer: "번개", choices: ["번개", "불꽃", "화산", "폭발"], category: "자연" },
  { emoji: "❄️", answer: "눈송이", choices: ["눈송이", "얼음", "우박", "진눈깨비"], category: "자연" },
  { emoji: "🌊", answer: "파도", choices: ["파도", "강", "호수", "바다"], category: "자연" },
  { emoji: "🌋", answer: "화산", choices: ["화산", "산", "언덕", "절벽"], category: "자연" },
  { emoji: "🏔️", answer: "산", choices: ["산", "언덕", "절벽", "화산"], category: "자연" },
  { emoji: "🌸", answer: "벚꽃", choices: ["벚꽃", "장미", "튤립", "해바라기"], category: "자연" },
  { emoji: "🌻", answer: "해바라기", choices: ["해바라기", "민들레", "국화", "벚꽃"], category: "자연" },
  { emoji: "🌵", answer: "선인장", choices: ["선인장", "나무", "대나무", "야자수"], category: "자연" },
  { emoji: "🌴", answer: "야자수", choices: ["야자수", "선인장", "소나무", "대나무"], category: "자연" },
  { emoji: "🍁", answer: "단풍잎", choices: ["단풍잎", "나뭇잎", "은행잎", "솔잎"], category: "자연" },
  { emoji: "🌺", answer: "꽃", choices: ["꽃", "잎", "열매", "뿌리"], category: "자연" },
  // ── 물건 ──
  { emoji: "🏠", answer: "집", choices: ["집", "학교", "병원", "회사"], category: "물건" },
  { emoji: "📚", answer: "책", choices: ["책", "노트", "공책", "수첩"], category: "물건" },
  { emoji: "✏️", answer: "연필", choices: ["연필", "볼펜", "사인펜", "형광펜"], category: "물건" },
  { emoji: "✂️", answer: "가위", choices: ["가위", "칼", "커터", "면도기"], category: "물건" },
  { emoji: "🔑", answer: "열쇠", choices: ["열쇠", "자물쇠", "잠금장치", "카드키"], category: "물건" },
  { emoji: "⏰", answer: "알람시계", choices: ["알람시계", "손목시계", "벽시계", "모래시계"], category: "물건" },
  { emoji: "📱", answer: "스마트폰", choices: ["스마트폰", "태블릿", "컴퓨터", "TV"], category: "물건" },
  { emoji: "💻", answer: "컴퓨터", choices: ["컴퓨터", "태블릿", "스마트폰", "TV"], category: "물건" },
  { emoji: "🎒", answer: "배낭", choices: ["배낭", "가방", "핸드백", "여행가방"], category: "물건" },
  { emoji: "👟", answer: "운동화", choices: ["운동화", "구두", "샌들", "부츠"], category: "물건" },
  { emoji: "🎩", answer: "모자", choices: ["모자", "헬멧", "왕관", "베레모"], category: "물건" },
  { emoji: "👓", answer: "안경", choices: ["안경", "선글라스", "고글", "돋보기"], category: "물건" },
  { emoji: "🪞", answer: "거울", choices: ["거울", "창문", "유리", "액자"], category: "물건" },
  { emoji: "🪥", answer: "칫솔", choices: ["칫솔", "빗", "면도기", "클렌저"], category: "물건" },
  { emoji: "🛁", answer: "욕조", choices: ["욕조", "세면대", "변기", "샤워기"], category: "물건" },
  { emoji: "🪴", answer: "화분", choices: ["화분", "꽃병", "바구니", "그릇"], category: "물건" },
  { emoji: "💡", answer: "전구", choices: ["전구", "손전등", "촛불", "랜턴"], category: "물건" },
  { emoji: "🎁", answer: "선물", choices: ["선물", "가방", "상자", "봉투"], category: "물건" },
  // ── 직업 ──
  { emoji: "👨‍⚕️", answer: "의사", choices: ["의사", "간호사", "약사", "수의사"], category: "직업" },
  { emoji: "👨‍🍳", answer: "요리사", choices: ["요리사", "제빵사", "카페직원", "배달원"], category: "직업" },
  { emoji: "👮", answer: "경찰관", choices: ["경찰관", "군인", "소방관", "경호원"], category: "직업" },
  { emoji: "👨‍🚀", answer: "우주인", choices: ["우주인", "비행사", "조종사", "탐험가"], category: "직업" },
  { emoji: "🧑‍🏫", answer: "선생님", choices: ["선생님", "교수님", "학생", "코치"], category: "직업" },
  { emoji: "👨‍🔧", answer: "기술자", choices: ["기술자", "청소부", "배달원", "경비원"], category: "직업" },
  { emoji: "🧑‍🎨", answer: "화가", choices: ["화가", "조각가", "음악가", "작가"], category: "직업" },
  { emoji: "👩‍🚒", answer: "소방관", choices: ["소방관", "경찰관", "군인", "구조대원"], category: "직업" },
  // ── 스포츠/놀이 ──
  { emoji: "⚽", answer: "축구공", choices: ["축구공", "야구공", "농구공", "배구공"], category: "스포츠" },
  { emoji: "🏀", answer: "농구공", choices: ["농구공", "축구공", "배구공", "럭비공"], category: "스포츠" },
  { emoji: "⚾", answer: "야구공", choices: ["야구공", "축구공", "테니스공", "골프공"], category: "스포츠" },
  { emoji: "🎮", answer: "게임기", choices: ["게임기", "리모컨", "조이스틱", "컨트롤러"], category: "스포츠" },
  { emoji: "🎸", answer: "기타", choices: ["기타", "바이올린", "첼로", "우쿨렐레"], category: "스포츠" },
  { emoji: "🎹", answer: "피아노", choices: ["피아노", "오르간", "하프시코드", "신시사이저"], category: "스포츠" },
  { emoji: "🎤", answer: "마이크", choices: ["마이크", "스피커", "이어폰", "헤드폰"], category: "스포츠" },
  { emoji: "🎯", answer: "다트", choices: ["다트", "화살", "총", "창"], category: "스포츠" },
  { emoji: "🎲", answer: "주사위", choices: ["주사위", "바둑돌", "카드", "동전"], category: "스포츠" },
  { emoji: "🧩", answer: "퍼즐", choices: ["퍼즐", "블록", "레고", "도미노"], category: "스포츠" },
];

const CATEGORIES = ["전체", "동물", "음식", "탈것", "자연", "물건", "직업", "스포츠"];
const CORRECT_COMMENTS = ["정답이에요!", "맞아요, 대단해요!", "훌륭해요!", "완벽해요!", "최고예요!"];
const WRONG_PREFIXES = ["아쉬워요! 정답은", "틀렸어요! 정답은", "다시 해봐요! 정답은"];

export default function QuizGame() {
  const [category, setCategory] = useState("전체");
  const [question, setQuestion] = useState(() => QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)]);
  const [answered, setAnswered] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [comment, setComment] = useState<{ text: string; correct: boolean } | null>(null);

  const filtered = useMemo(() =>
    category === "전체" ? QUIZ_DATA : QUIZ_DATA.filter(q => q.category === category),
    [category]
  );

  const getRandomQuestion = useCallback((pool: QuizItem[] = filtered, exclude?: QuizItem) => {
    let q: QuizItem;
    do { q = pool[Math.floor(Math.random() * pool.length)]; }
    while (pool.length > 1 && q === exclude);
    return q;
  }, [filtered]);

  const shuffledChoices = useMemo(() =>
    [...question.choices].sort(() => Math.random() - 0.5),
    [question]
  );

  const handleAnswer = useCallback((choice: string) => {
    if (answered !== null) return;
    setAnswered(choice);
    setTotal(t => t + 1);
    const isCorrect = choice === question.answer;
    const feedbackMsg = isCorrect
      ? CORRECT_COMMENTS[Math.floor(Math.random() * CORRECT_COMMENTS.length)]
      : `${WRONG_PREFIXES[Math.floor(Math.random() * WRONG_PREFIXES.length)]} "${question.answer}"이에요`;
    if (isCorrect) setScore(s => s + 1);
    setComment({ text: feedbackMsg, correct: isCorrect });
    // 자동 다음 문제 (음성 없이)
    setTimeout(() => {
      setAnswered(null);
      setComment(null);
      setQuestion(getRandomQuestion(filtered, question));
    }, 1800);
  }, [answered, question, filtered, getRandomQuestion]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const pool = cat === "전체" ? QUIZ_DATA : QUIZ_DATA.filter(q => q.category === cat);
    setQuestion(pool[Math.floor(Math.random() * pool.length)]);
    setAnswered(null); setComment(null);
  };

  return (
    <div className="w-full">
      <PageHeader title="퀴즈 놀이" emoji="❓" backHref="/dashboard/games" />

      {/* Category filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              category === cat ? "bg-pink-500 text-white shadow" : "bg-pink-50 text-pink-600 hover:bg-pink-100"
            }`}>
            {cat} {cat !== "전체" && `(${QUIZ_DATA.filter(q => q.category === cat).length})`}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-500">점수: <b>{score}/{total}</b></span>
        <Button variant="outline" size="sm" onClick={() => {
          setScore(0); setTotal(0); setComment(null);
          setQuestion(getRandomQuestion(filtered));
        }}>초기화</Button>
      </div>

      <div className="space-y-5">
        <AnimatePresence mode="wait">
          <motion.div key={question.emoji + question.answer}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="rounded-2xl bg-white shadow-notion p-8 text-center select-none"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">이게 뭐예요?</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "#FFF0F8", color: "#FF69B4" }}>
                  {question.category}
                </span>
                <button
                  onClick={() => speak("이게 뭐예요?", { lang: "ko" })}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95"
                  style={{ background: "#FFF0F8", color: "#EC4899", border: "1.5px solid #FBCFE8" }}
                >
                  🔊 듣기
                </button>
              </div>
            </div>
            <div className="text-8xl">{question.emoji}</div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {comment && (
            <motion.div initial={{ opacity: 0, scale: 0.85, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl py-3 px-4 text-center font-black text-base"
              style={comment.correct
                ? { background: "#F0FDF4", border: "2px solid #86EFAC", color: "#15803D" }
                : { background: "#FFF1F2", border: "2px solid #FECDD3", color: "#BE123C" }
              }>
              {comment.correct ? "🌟 " : "💪 "}{comment.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          {shuffledChoices.map((choice) => {
            const isCorrect = choice === question.answer;
            const isSelected = answered === choice;
            let cls = "rounded-xl py-4 text-base font-semibold border-2 transition-all duration-200 ";
            if (answered !== null) {
              if (isCorrect) cls += "bg-green-50 border-green-400 text-green-700";
              else if (isSelected) cls += "bg-red-50 border-red-400 text-red-700";
              else cls += "bg-gray-50 border-gray-200 text-gray-300";
            } else {
              cls += "bg-white border-gray-200 hover:border-pink-400 hover:shadow-notion cursor-pointer";
            }
            return (
              <button key={choice} onClick={() => handleAnswer(choice)} className={cls}>{choice}</button>
            );
          })}
        </div>

        <p className="text-xs text-center text-gray-400">총 {filtered.length}문제 · {category} 카테고리</p>
      </div>
    </div>
  );
}
