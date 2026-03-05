import { z } from "zod";
import { ai } from "./index";

const AGE_GROUP = z.enum(["1-2", "3-4", "5-6", "7-8", "9-10"]);

const EnglishInputSchema = z.object({
  ageGroup: AGE_GROUP,
  topic: z.string().optional().describe("단어/대화 주제 (예: 동물, 학교, 가족)"),
});

const WordItemSchema = z.object({
  word: z.string(),
  pronunciation: z.string().describe("한글 발음 표기"),
  meaning: z.string(),
  emoji: z.string(),
  exampleSentence: z.string(),
  exampleTranslation: z.string(),
});

const DialogueLineSchema = z.object({
  speaker: z.enum(["A", "B"]),
  speakerName: z.string(),
  text: z.string(),
  translation: z.string(),
});

const CombinedSchema = z.object({
  contentType: z.enum(["combined"]),
  title: z.string(),
  ageGroup: z.string(),
  words: z.array(WordItemSchema),
  situation: z.string(),
  dialogue: z.array(DialogueLineSchema),
});

export type EnglishInput = z.infer<typeof EnglishInputSchema>;
export type WordItem = z.infer<typeof WordItemSchema>;
export type DialogueLine = z.infer<typeof DialogueLineSchema>;
export type CombinedOutput = z.infer<typeof CombinedSchema>;

export type WordsOutput = {
  contentType: "words";
  title: string;
  ageGroup: string;
  words: WordItem[];
};
export type DialogueOutput = {
  contentType: "dialogue";
  title: string;
  ageGroup: string;
  situation: string;
  lines: DialogueLine[];
  vocabulary: { word: string; meaning: string }[];
};
export type SentencesOutput = {
  contentType: "sentences";
  title: string;
  ageGroup: string;
  sentences: { sentence: string; translation: string; pattern: string; emoji: string; practice: string }[];
};
export type EnglishOutput = CombinedOutput | WordsOutput | DialogueOutput | SentencesOutput;

// ── 연령별 엄격한 사양 ──────────────────────────────────────────────────────
const AGE_SPECS: Record<string, {
  wordCount: number;
  dialogueLines: number;
  profile: string;
  allowed: string;
  forbidden: string;
  vocabLevel: string;
  grammarLevel: string;
  sentenceLimit: string;
}> = {
  "1-2": {
    wordCount: 3,
    dialogueLines: 0,
    profile: "1-2세 영아 (말을 막 시작하는 수준, 단어 인식 단계)",
    allowed: "cat, dog, ball, cup, hat, sun, red, big, mom, dad 같은 1-2음절 기초 명사/형용사",
    forbidden: "동사(run, eat 제외), 전치사, 접속사, 3음절 이상 단어, 문장, 대화, 추상 개념",
    vocabLevel: "최빈도 100단어 내 단어만. 반드시 3~4글자 이내 단어(cat, dog, red, sun 등)",
    grammarLevel: "문법 불필요. 단어 카드 수준",
    sentenceLimit: "예문은 단어 하나 또는 '(단어) + 이모지' 형태만. 절대 완전한 문장 금지",
  },
  "3-4": {
    wordCount: 4,
    dialogueLines: 4,
    profile: "3-4세 유아 (짧은 문장 이해, 기초 어휘 200단어 수준)",
    allowed: "기초 명사/동사(run, eat, play, like), 간단한 형용사(big, small, red, happy)",
    forbidden: "추상 명사, 과거시제, 완료시제, 가정법, 수동태, 4음절 이상 단어, 의문사(why, how) 사용 질문",
    vocabLevel: "최빈도 300단어 내. 최대 5글자 이내(apple, happy, sunny 정도가 최대)",
    grammarLevel: "현재형 긍정문만(I like~, It is~). 의문문은 Yes/No 질문만(Is it~?)",
    sentenceLimit: "예문 최대 4단어. 대화 각 줄 최대 5단어",
  },
  "5-6": {
    wordCount: 5,
    dialogueLines: 6,
    profile: "5-6세 유아 (기초 문장 읽기 시작, 기본 파닉스 학습 단계)",
    allowed: "기초 Sight Words + 주제 관련 명사/동사/형용사. 현재/현재진행형 문장",
    forbidden: "과거완료, 가정법, 수동태, 관계대명사(that/which/who 절), 6음절 이상 단어, 이중부정",
    vocabLevel: "Fry 첫 번째 100단어 수준 + 주제 단어. 최대 7글자(rainbow, birthday 정도가 최대)",
    grammarLevel: "현재형/현재진행형(I am playing). 단순 미래(I will~). 기초 의문문(What, Where, Who)",
    sentenceLimit: "예문 최대 7단어. 대화 각 줄 최대 8단어",
  },
  "7-8": {
    wordCount: 7,
    dialogueLines: 8,
    profile: "7-8세 아동 (초등 저학년, 기초 문해력 갖춤)",
    allowed: "초등 저학년 어휘. 형용사/부사 포함. 과거시제 기초 문장",
    forbidden: "완료시제(have + p.p.), 가정법, 관계절(which/who/that), 전문용어, 은어/속어",
    vocabLevel: "초등 1-2학년 수준 어휘. 접두사(un-, re-)가 붙은 단어 가능",
    grammarLevel: "단순 현재/과거/미래. 비교급(bigger, faster). 기초 접속사(because, but, and, so)",
    sentenceLimit: "예문 최대 12단어. 대화 각 줄 최대 12단어. 복합문 가능",
  },
  "9-10": {
    wordCount: 10,
    dialogueLines: 10,
    profile: "9-10세 아동 (초등 고학년, 풍부한 어휘 학습 단계)",
    allowed: "초등 고학년 어휘. 추상 명사/다음절 단어. 다양한 시제. 의견/감정 표현",
    forbidden: "고급 문학 어휘, 전문용어, 속어/비속어, 부정적/폭력적 내용",
    vocabLevel: "초등 3-4학년 수준 어휘. 접두사/접미사 다양하게 가능",
    grammarLevel: "현재완료 기초(have been), 수동태 기초, 비교급/최상급, 복합문/종속절 가능",
    sentenceLimit: "예문 최대 15단어. 대화 각 줄 최대 15단어. 자연스러운 일상 대화 수준",
  },
};

export const englishFlow = ai.defineFlow(
  {
    name: "englishFlow",
    inputSchema: EnglishInputSchema,
  },
  async (input) => {
    const spec = AGE_SPECS[input.ageGroup] ?? AGE_SPECS["5-6"];
    const topic = input.topic ?? "일상생활";

    if (input.ageGroup === "1-2") {
      const { output } = await ai.generate({
        prompt: `유아 영어 단어 카드를 생성하세요.

【대상】 ${spec.profile}
【주제】 "${topic}"
【단어 수】 ${spec.wordCount}개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 엄격한 규칙】

✅ 사용 가능한 어휘: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 어휘 수준: ${spec.vocabLevel}
📏 문법 수준: ${spec.grammarLevel}
📏 문장 길이: ${spec.sentenceLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【출력 형식】
- situation은 빈 문자열("")
- dialogue는 빈 배열([])
- 각 word의 exampleSentence는 단어 1개 또는 이모지만 (문장 완전 금지)
- pronunciation은 아이가 따라 말할 수 있게 간단한 한글 표기 (예: 캣, 독, 볼)

⚠️ 생성 전 자가 검토: 각 단어가 위 규칙을 모두 만족하는지 확인 후 출력하세요.`,
        output: { schema: CombinedSchema },
      });
      return { ...(output as CombinedOutput), ageGroup: input.ageGroup, contentType: "combined" as const };
    }

    const { output } = await ai.generate({
      prompt: `유아/아동 영어 학습 자료를 생성하세요.

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

1. words 배열에 단어 ${spec.wordCount}개:
   - 반드시 위 어휘 수준과 금지 항목을 지키세요
   - pronunciation: 한글 발음 표기 (예: dog → 독)
   - exampleSentence: 위 문장 길이 제한 엄수
   - exampleTranslation: 한국어 번역

2. dialogue 배열에 대화 ${spec.dialogueLines}줄:
   - 두 명의 친근한 어린이 캐릭터 (speakerName 귀엽게 설정)
   - words의 단어들을 대화에 자연스럽게 포함
   - 문장 길이 제한 엄수
   - 각 줄마다 한국어 번역 포함
   - situation에 대화 상황 간단히 설명

⚠️ 생성 전 자가 검토: 모든 단어와 문장이 ${input.ageGroup}세 수준에 맞는지 확인 후 출력하세요.
단어 하나라도 금지 규칙 위반 시 더 쉬운 단어로 교체하세요.`,
      output: { schema: CombinedSchema },
    });
    return { ...(output as CombinedOutput), ageGroup: input.ageGroup, contentType: "combined" as const };
  }
);
