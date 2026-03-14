import { z } from "zod";
import { ai } from "./index";
import {
  DEVELOPMENTAL_CONTEXT,
  HANGUL_CONSONANTS_EASY,
  HANGUL_VOWELS_BASIC,
  JAMO_MNEMONICS,
} from "../pedagogy";
import type { AgeGroup } from "../pedagogy";

const AGE_GROUP = z.enum(["1-2", "3-4", "5-6", "7-8", "9-10"]);

const HangulInputSchema = z.object({
  ageGroup: AGE_GROUP,
  topic: z.string().optional().describe("학습 주제 (예: 동물, 음식, 가족)"),
});

const HangulItemSchema = z.object({
  char: z.string().describe("글자·자모·단어 (예: ㄱ, 가, 사과)"),
  syllables: z.array(z.string()).describe("음절 또는 자모 분리 (예: ['사','과'] 또는 ['ㄱ'])"),
  meaning: z.string().describe("뜻 또는 연상 설명 (자모일 경우 연상 기억법)"),
  emoji: z.string(),
  exampleSentence: z.string().describe("예문 또는 예시 단어"),
  mnemonic: z.string().optional().describe("자모 연상 기억법 — 3-4세 자모 교육 전용 (예: ㄱ은 기차가 꺾이는 모양이에요 🚂)"),
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
  learningGoal: z.string().optional().describe("이번 학습의 핵심 목표 (예: 'ㄱ,ㄴ,ㅁ 자음과 ㅏ,ㅣ 모음 인식')"),
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

// ── 연령별 한글 교육 전략 (발달 이론 기반) ────────────────────────────────
const HANGUL_AGE_SPEC: Record<AgeGroup, {
  itemCount: number;
  passageLines: number;
  questionCount: number;
  profile: string;
  phonologicalLevel: string;
  allowed: string;
  forbidden: string;
  teachingApproach: string;
  sentenceLimit: string;
}> = {
  "1-2": {
    itemCount: 3,
    passageLines: 0,
    questionCount: 0,
    profile: "1-2세 영아 — 소리·이미지 연결 단계. 글자 개념 없음. 음운 인식 형성 前",
    phonologicalLevel: "단어 수준 음운 인식 전 단계. 소리와 사물·이미지의 연합(pairing)만 가능",
    allowed: "엄마, 아빠, 맘마, 물, 공, 개, 해, 달, 꽃 등 생후 12개월 이내 친숙한 1-2음절 명사·친족어·의성어",
    forbidden: "자음·모음 명칭 교육, 글자 분해, 받침, 완전한 문장, 지문, 추상 개념, 단독 동사·형용사, 3음절 이상 단어",
    teachingApproach: "소리(TTS)+이미지(이모지) 연결만. 자모 교육 없음. 의성어·의태어 풍부하게.",
    sentenceLimit: "예문은 단어 1개 또는 이모지만. 완전한 문장 절대 금지",
  },
  "3-4": {
    itemCount: 6,
    passageLines: 3,
    questionCount: 0,
    profile: "3-4세 유아 — 음절 수준 음운 인식 발달 중. 자모 호기심 시작. 자기 이름 글자에 관심",
    phonologicalLevel: "음절 인식(단어를 박수로 나눌 수 있음) 발달 단계. 음소 인식은 아직 전 단계.",
    // 3-4세는 자모 교육 특화: 쉬운 자음 + 기본 모음 + 이로 만든 개음절(받침 없는 글자)
    allowed: `자음 ${HANGUL_CONSONANTS_EASY.slice(0, 5).join("/")} + 모음 ${HANGUL_VOWELS_BASIC.slice(0, 4).join("/")} 먼저 소개.
이 자모로 만들 수 있는 개음절(받침 없음): 마/나/아/바/사/가 등.
단어는 받침 없거나 단순 받침(ㅇ)만: 아이, 나무, 바나나, 오리 등.`,
    forbidden: "이중모음(ㅐ,ㅔ,ㅘ 등), 이중 받침, 쌍자음, 쌍모음, 5음절 이상 단어, 불규칙 용언, 추상 명사",
    teachingApproach: `자모+개음절+단어를 함께 제시하는 '다리 놓기' 방식:
1) 자모 카드 (ㄱ/ㄴ/ㅁ 등 + 연상 기억법): items 앞 3개에 자모 배치, mnemonic 필드 필수 작성
2) 개음절 카드 (가/나/마 등): 해당 자모가 들어간 간단한 음절
3) 단어 카드 (나무/아이/마마 등): 배운 자모·음절이 포함된 쉬운 단어
모든 items에서 syllables = 음절 또는 자모 단위로 분리.`,
    sentenceLimit: "예문 최대 4어절. 지문 각 문장 최대 6어절 (3문장)",
  },
  "5-6": {
    itemCount: 5,
    passageLines: 6,
    questionCount: 0,
    profile: "5-6세 유아 — 음소 인식 발달 중. 자음 14개 + 모음 10개 완성 가능. 기본 받침 7개 학습",
    phonologicalLevel: "음소 인식(phoneme awareness) 발달 단계. CVC 음절 해독 시작. 기본 받침 7개(ㄱ/ㄴ/ㄷ/ㄹ/ㅁ/ㅂ/ㅇ) 인식 가능.",
    allowed: `주제 관련 명사·동사·형용사. 기본 받침 포함 단어 가능.
음절 구조(초성+중성+종성) 시각화가 가능한 단어. 최대 4음절.
현재형·진행형 문장 사용 가능.`,
    forbidden: "이중 받침(닭/읽다 등), 이중모음 심화, 불규칙 용언, 6음절 이상 단어, 복합문, 피동문",
    teachingApproach: "단어→음절 분리→자모 분석 순서. 받침이 있는 글자는 초성+중성+종성 색깔 구분 안내.",
    sentenceLimit: "예문 최대 7어절. 지문 각 문장 최대 10어절 (5-6문장)",
  },
  "7-8": {
    itemCount: 6,
    passageLines: 9,
    questionCount: 2,
    profile: "7-8세 아동 — 독립 독해 시작. 이중모음·쌍자음·이중받침 학습 단계",
    phonologicalLevel: "독립 독해 가능. 이중모음(ㅐ,ㅔ,ㅘ,ㅙ 등), 쌍자음(ㄲ,ㄸ,ㅃ,ㅆ,ㅉ), 이중받침 학습 시기.",
    allowed: "초등 1-2학년 어휘. 형용사·부사. 접속사. 과거시제. 이중모음·쌍자음·이중받침 포함 단어 가능",
    forbidden: "완료형(~었었다), 복잡한 피동(~게 되어지다), 전문용어, 한자어 과다, 은어·속어",
    teachingApproach: "복잡한 자모를 포함한 단어를 이야기 맥락 안에서 자연스럽게 제시. 맞춤법 패턴 반복.",
    sentenceLimit: "예문 최대 12어절. 지문 각 문장 최대 15어절 (8-10문장). 복합문 가능",
  },
  "9-10": {
    itemCount: 8,
    passageLines: 12,
    questionCount: 3,
    profile: "9-10세 아동 — 한자어·고유어 구분. 어근·접사 분석. 2차 어휘 폭발기",
    phonologicalLevel: "완전한 한글 해독 완성. 어휘 분석적 이해 시작(접두사·어근·접미사, 한자어vs고유어 대비).",
    allowed: "초등 3-4학년 어휘. 추상 명사·다음절 단어. 한자어·고유어 비교. 접두사·접미사(-스럽다/-롭다/-하다). 속담·관용어 1-2개",
    forbidden: "성인 전문용어, 학술 용어, 욕설·비속어, 부정적·폭력적 내용",
    teachingApproach: "한자어↔고유어 대비 학습. 어근 분석(먹+이=먹이). 문맥 속 어휘 추론 유도.",
    sentenceLimit: "예문 최대 15어절. 지문 자연스러운 흐름. 문단 구조 있는 글 가능",
  },
};

// 3-4세용 자모 연상법 문자열 생성
const buildMnemonicGuide = () =>
  Object.entries(JAMO_MNEMONICS)
    .slice(0, 10) // 자음 10개만
    .map(([jamo, hint]) => `  ${jamo}: ${hint}`)
    .join("\n");

export const hangulFlow = ai.defineFlow(
  {
    name: "hangulFlow",
    inputSchema: HangulInputSchema,
  },
  async (input) => {
    const age = input.ageGroup as AgeGroup;
    const spec = HANGUL_AGE_SPEC[age];
    const devCtx = DEVELOPMENTAL_CONTEXT[age];
    const topic = input.topic ?? "일상생활";

    // ── 1-2세: 소리·이미지 연결 전용 ──────────────────────────────────────
    if (age === "1-2") {
      const { output } = await ai.generate({
        prompt: `유아 한글 단어 카드를 생성하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【발달 단계 이해】
${devCtx}

음운 인식 수준: ${spec.phonologicalLevel}
교수 접근법: ${spec.teachingApproach}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【대상】 ${spec.profile}
【주제】 "${topic}"
【단어 수】 ${spec.itemCount}개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 규칙】

✅ 사용 가능: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 문장 제한: ${spec.sentenceLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【출력 형식】
- passage는 빈 문자열("")
- comprehension은 빈 배열([])
- mnemonic은 null (자모 교육 없음)
- 각 item.exampleSentence는 단어 1개 또는 이모지만 (문장 절대 금지)
- syllables는 음절 분리 (예: "아빠" → ["아","빠"])
- learningGoal: "소리와 이미지 연결 — ${topic} 단어 ${spec.itemCount}개"

⚠️ 생성 전 자가 검토: 각 단어가 위 규칙을 모두 만족하는지 확인 후 출력하세요.`,
        output: { schema: HangulCombinedSchema },
      });
      return {
        ...(output as HangulCombinedOutput),
        ageGroup: input.ageGroup,
        contentType: "hangul_combined" as const,
      };
    }

    // ── 3-4세: 자모 + 개음절 + 단어 '다리 놓기' 방식 ──────────────────────
    if (age === "3-4") {
      const { output } = await ai.generate({
        prompt: `유아 한글 자모·음절·단어 카드를 생성하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【발달 단계 이해】
${devCtx}

음운 인식 수준: ${spec.phonologicalLevel}
교수 접근법: ${spec.teachingApproach}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【대상】 ${spec.profile}
【주제】 "${topic}"
【카드 총 수】 ${spec.itemCount}개 (자모 2개 + 개음절 2개 + 단어 2개)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 규칙】

✅ 사용 가능: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 문장 제한: ${spec.sentenceLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【자모 연상 기억법 참고】(items 앞 2개에서 활용, mnemonic 필드에 반드시 작성)
${buildMnemonicGuide()}

【출력 구조 — 순서 중요】

items 배열을 다음 순서로 구성하세요:

1-2번 (자모 카드): char = 단일 자음 또는 모음 (예: "ㄱ", "ㅏ")
  - syllables = [해당 자모] (예: ["ㄱ"])
  - meaning = 자모 이름과 소리 설명 (예: "기역, '그' 소리가 나요")
  - mnemonic = 연상 기억법 (위 목록에서 선택하거나 새로 창작)
  - exampleSentence = 해당 자모로 시작하는 가장 쉬운 단어 1개 (예: "가방")
  - emoji = 연상 이미지

3-4번 (개음절 카드): char = 위 자모로 만든 받침 없는 1음절 (예: "가", "나")
  - syllables = [초성 자음, 중성 모음] (예: ["ㄱ", "ㅏ"])
  - meaning = 음절 구성 설명 + 읽는 법 (예: "ㄱ+ㅏ = 가")
  - mnemonic = null
  - exampleSentence = 이 음절이 포함된 쉬운 단어 (예: "가방")
  - emoji = 관련 이모지

5-6번 (단어 카드): char = 위 음절이 포함된 2-3음절 단어 (예: "나무", "아이")
  - syllables = 음절 분리 (예: ["나", "무"])
  - meaning = 단어 뜻 (아이 눈높이)
  - mnemonic = null
  - exampleSentence = 단어 사용 예문 (최대 4어절)
  - emoji = 단어 이모지

passage: "${topic}" 주제의 짧은 이야기 (3문장, 각 최대 6어절, 위 단어 포함)
comprehension: 빈 배열([])
learningGoal: 이번에 배운 자모와 단어 요약 (예: "ㄱ,ㄴ 자음 + ㅏ,ㅣ 모음 → 가/나 음절 → 나무/아이 단어")

⚠️ 자가 검토: mnemonic이 자모 카드에 빠지지 않았는지, 받침 없는 음절만 사용했는지 확인하세요.`,
        output: { schema: HangulCombinedSchema },
      });
      return {
        ...(output as HangulCombinedOutput),
        ageGroup: input.ageGroup,
        contentType: "hangul_combined" as const,
      };
    }

    // ── 5-6세 ~ 9-10세: 단어+지문 학습 ───────────────────────────────────
    const { output } = await ai.generate({
      prompt: `유아/아동 한글 학습 자료를 생성하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【발달 단계 이해】
${devCtx}

음운 인식 수준: ${spec.phonologicalLevel}
교수 접근법: ${spec.teachingApproach}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【대상】 ${spec.profile}
【주제】 "${topic}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 규칙】

✅ 사용 가능: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 문장 제한: ${spec.sentenceLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【생성 내용】

1. items 배열에 단어/글자 ${spec.itemCount}개:
   - 반드시 위 어휘·금지 규칙 준수
   - syllables: 음절 분리 (예: "사과" → ["사","과"])
   - meaning: 아이가 이해하기 쉽게 설명
   - exampleSentence: 문장 길이 제한 엄수
   - emoji로 시각화
   - mnemonic: null (5세 이상은 자모 연상법 불필요)

2. passage에 읽기 지문 ${spec.passageLines > 0 ? `${spec.passageLines}줄 내외` : "없음 (빈 문자열)"}:
${spec.passageLines > 0
  ? `   - items의 단어들을 지문에 자연스럽게 포함
   - "${topic}" 주제의 재미있는 짧은 이야기
   - 문장 길이 제한 엄수`
  : `   - passage는 빈 문자열("")`}

3. comprehension ${spec.questionCount > 0 ? `질문 ${spec.questionCount}개` : "없음 (빈 배열)"}:
${spec.questionCount > 0
  ? `   - 지문 이해 확인 질문 (연령에 맞는 난이도)
   - 각 질문에 정답 포함`
  : `   - comprehension은 빈 배열([])`}

4. learningGoal: 이번 학습의 핵심 목표 1줄 요약

⚠️ 생성 전 자가 검토: 모든 단어와 문장이 ${input.ageGroup}세 수준에 맞는지 확인 후 출력하세요.
금지 규칙 위반 시 더 쉬운 단어/문장으로 교체하세요.`,
      output: { schema: HangulCombinedSchema },
    });
    return {
      ...(output as HangulCombinedOutput),
      ageGroup: input.ageGroup,
      contentType: "hangul_combined" as const,
    };
  }
);
