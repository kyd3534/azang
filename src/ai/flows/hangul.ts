import { z } from "zod";
import { ai } from "./index";

const AGE_GROUP = z.enum(["1-2", "3-4", "5-6", "7-8", "9-10"]);

const HangulInputSchema = z.object({
  ageGroup: AGE_GROUP,
  topic: z.string().optional().describe("학습 주제 (예: 동물, 음식, 가족)"),
});

const HangulItemSchema = z.object({
  char: z.string().describe("글자 또는 단어 (예: 가, 사과)"),
  syllables: z.array(z.string()).describe("음절 분리 (예: ['사', '과'])"),
  meaning: z.string().describe("뜻 설명"),
  emoji: z.string(),
  exampleSentence: z.string().describe("예문"),
});

const ComprehensionSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const HangulCombinedSchema = z.object({
  contentType: z.enum(["hangul_combined"]),
  title: z.string(),
  ageGroup: z.string(),
  items: z.array(HangulItemSchema),
  passage: z.string().describe("읽기 지문 (어린 연령은 빈 문자열)"),
  comprehension: z.array(ComprehensionSchema).describe("이해 확인 질문 (어린 연령은 빈 배열)"),
});

// ── 하위 호환 구 타입 (DB 저장된 기존 데이터용) ──────────────
const LegacyJamoSchema = z.object({
  contentType: z.enum(["jamo"]),
  title: z.string(),
  ageGroup: z.string(),
  jamoType: z.enum(["vowels", "consonants"]),
  items: z.array(z.object({
    char: z.string(),
    name: z.string(),
    sound: z.string(),
    example: z.string(),
    emoji: z.string(),
  })),
});
const LegacyWordsSchema = z.object({
  contentType: z.enum(["words"]),
  title: z.string(),
  ageGroup: z.string(),
  words: z.array(z.object({
    word: z.string(),
    syllables: z.array(z.string()),
    meaning: z.string(),
    emoji: z.string(),
    sentence: z.string(),
  })),
});
const LegacySentencesSchema = z.object({
  contentType: z.enum(["sentences"]),
  title: z.string(),
  ageGroup: z.string(),
  sentences: z.array(z.object({
    sentence: z.string(),
    highlight: z.string(),
    meaning: z.string(),
    question: z.string(),
    emoji: z.string(),
  })),
});

export type HangulInput = z.infer<typeof HangulInputSchema>;
export type HangulCombinedOutput = z.infer<typeof HangulCombinedSchema>;
export type JamoOutput = z.infer<typeof LegacyJamoSchema>;
export type HangulWordsOutput = z.infer<typeof LegacyWordsSchema>;
export type HangulSentencesOutput = z.infer<typeof LegacySentencesSchema>;
export type HangulOutput = HangulCombinedOutput | JamoOutput | HangulWordsOutput | HangulSentencesOutput;

// ── 연령별 엄격한 사양 ──────────────────────────────────────────────────────
const AGE_SPECS: Record<string, {
  itemCount: number;
  passageLines: number;
  questionCount: number;
  profile: string;
  allowed: string;
  forbidden: string;
  vocabLevel: string;
  grammarLevel: string;
  sentenceLimit: string;
}> = {
  "1-2": {
    itemCount: 3,
    passageLines: 0,
    questionCount: 0,
    profile: "1-2세 영아 (소리·이미지 연결 단계, 한글을 처음 접하는 수준)",
    allowed: "엄마, 아빠, 맘마, 물, 공, 개, 해, 달, 꽃 같은 1-2음절 친족어·기초 명사·의성어",
    forbidden: "3음절 이상 단어, 받침 복잡한 글자(읽, 닭 등), 완전한 문장, 지문, 추상 개념, 단독 동사/형용사",
    vocabLevel: "가장 기초적인 1-2음절 단어만. 받침 없는 글자 우선 (가, 나, 다, 아, 야 등)",
    grammarLevel: "문법 불필요. 단어 카드 수준",
    sentenceLimit: "예문은 단어 1개 또는 '단어 + 이모지' 형태만. 완전한 문장 절대 금지",
  },
  "3-4": {
    itemCount: 4,
    passageLines: 3,
    questionCount: 0,
    profile: "3-4세 유아 (기초 단어 인식, 짧은 문장 이해 시작)",
    allowed: "친숙한 2-3음절 단어 (사과, 고양이, 하늘 등). 기본 받침(ㅇ, ㄴ, ㄹ) 포함 단어",
    forbidden: "4음절 이상 단어, 이중 받침, 문어체 표현, 복합문, 부정문, 추상 명사, 의문사(왜, 어떻게) 문장",
    vocabLevel: "유아 기초 어휘 200단어 내. 2-3음절이 최대",
    grammarLevel: "현재형 긍정 단문만 (예: 나는 사과를 먹어요). Yes/No 대답 가능한 수준",
    sentenceLimit: "예문 최대 4단어. 지문 각 문장 최대 6단어 (3문장)",
  },
  "5-6": {
    itemCount: 5,
    passageLines: 6,
    questionCount: 0,
    profile: "5-6세 유아 (기초 문장 읽기 시작, 파닉스 학습 단계)",
    allowed: "주제 관련 명사/동사/형용사. 기본 받침 포함. 현재형·진행형 문장",
    forbidden: "5음절 이상 단어, 이중 받침 복잡한 단어, 복합문, 과거완료, 피동문, 관형절, 추상 개념",
    vocabLevel: "유아 어휘 500단어 수준. 최대 4음절 단어까지 (5음절 이상 금지)",
    grammarLevel: "현재형/진행형 (나는 달리고 있어요). 단순 의문문 (무엇이에요?, 어디 있어요?)",
    sentenceLimit: "예문 최대 7단어. 지문 각 문장 최대 10단어 (5-6문장)",
  },
  "7-8": {
    itemCount: 6,
    passageLines: 9,
    questionCount: 2,
    profile: "7-8세 아동 (초등 저학년, 기초 문해력 갖춤)",
    allowed: "초등 1-2학년 어휘. 형용사·부사 포함. 접속사 사용. 과거시제 기초",
    forbidden: "완료형(~었었다), 피동 복합(~게 되어지다), 전문용어, 한자어 과다, 은어/속어",
    vocabLevel: "초등 1-2학년 수준. 접두사(새-, 헛-) 포함 단어 가능",
    grammarLevel: "현재/과거/미래 기본. 비교 표현(더, 가장). 접속사(그리고, 하지만, 그래서, 왜냐하면)",
    sentenceLimit: "예문 최대 12단어. 지문 각 문장 최대 15단어 (8-10문장). 복합문 가능",
  },
  "9-10": {
    itemCount: 8,
    passageLines: 12,
    questionCount: 3,
    profile: "9-10세 아동 (초등 고학년, 풍부한 어휘 학습 단계)",
    allowed: "초등 3-4학년 어휘. 추상 명사·다음절 단어. 다양한 시제. 의견·감정 표현. 간단한 피동문",
    forbidden: "고급 문학 어휘, 전문·학술 용어, 속어/비속어, 부정적·폭력적 내용",
    vocabLevel: "초등 3-4학년 수준. 접두사·접미사 다양하게 가능 (-스럽다, -롭다 등)",
    grammarLevel: "다양한 시제·종결어미. 피동문 기초. 복합문·관형절 가능. 자연스러운 일상 대화 수준",
    sentenceLimit: "예문 최대 15단어. 지문 각 문장 제한 없음. 자연스러운 이야기 흐름",
  },
};

export const hangulFlow = ai.defineFlow(
  {
    name: "hangulFlow",
    inputSchema: HangulInputSchema,
  },
  async (input) => {
    const spec = AGE_SPECS[input.ageGroup] ?? AGE_SPECS["5-6"];
    const topic = input.topic ?? "일상생활";

    if (input.ageGroup === "1-2") {
      const { output } = await ai.generate({
        prompt: `유아 한글 단어 카드를 생성하세요.

【대상】 ${spec.profile}
【주제】 "${topic}"
【단어 수】 ${spec.itemCount}개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 엄격한 규칙】

✅ 사용 가능한 어휘: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 어휘 수준: ${spec.vocabLevel}
📏 문법 수준: ${spec.grammarLevel}
📏 문장 길이: ${spec.sentenceLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【출력 형식】
- passage는 빈 문자열("")
- comprehension은 빈 배열([])
- 각 item의 exampleSentence는 단어 1개 또는 이모지만 (문장 완전 금지)
- syllables는 음절 분리 (예: "아빠" → ["아","빠"])

⚠️ 생성 전 자가 검토: 각 단어가 위 규칙을 모두 만족하는지 확인 후 출력하세요.`,
        output: { schema: HangulCombinedSchema },
      });
      return { ...(output as HangulCombinedOutput), ageGroup: input.ageGroup, contentType: "hangul_combined" as const };
    }

    const { output } = await ai.generate({
      prompt: `유아/아동 한글 학습 자료를 생성하세요.

【대상】 ${spec.profile}
【주제】 "${topic}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 엄격한 규칙】

✅ 사용 가능한 어휘: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 어휘 수준: ${spec.vocabLevel}
📏 문법 수준: ${spec.grammarLevel}
📏 문장 길이: ${spec.sentenceLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【생성 내용】

1. items 배열에 단어/글자 ${spec.itemCount}개:
   - 반드시 위 어휘 수준과 금지 항목을 지키세요
   - syllables: 음절 분리 (예: "사과" → ["사","과"])
   - meaning: 아이가 이해하기 쉽게 설명
   - exampleSentence: 위 문장 길이 제한 엄수
   - emoji로 시각화

2. passage에 읽기 지문 ${spec.passageLines > 0 ? `${spec.passageLines}줄 내외` : "없음 (빈 문자열)"}:
${spec.passageLines > 0
  ? `   - items에서 만든 단어들을 지문에 자연스럽게 포함
   - 연령에 맞는 재미있는 짧은 이야기 형식
   - 문장 길이 제한 엄수`
  : "   - passage는 빈 문자열(\"\")로 설정"}

3. comprehension ${spec.questionCount > 0 ? `질문 ${spec.questionCount}개` : "없음 (빈 배열)"}:
${spec.questionCount > 0
  ? `   - 지문 이해 확인 질문
   - 각 질문에 정답 포함`
  : "   - comprehension은 빈 배열([])로 설정"}

⚠️ 생성 전 자가 검토: 모든 단어와 문장이 ${input.ageGroup}세 수준에 맞는지 확인 후 출력하세요.
단어 하나라도 금지 규칙 위반 시 더 쉬운 단어로 교체하세요.`,
      output: { schema: HangulCombinedSchema },
    });
    return { ...(output as HangulCombinedOutput), ageGroup: input.ageGroup, contentType: "hangul_combined" as const };
  }
);
