import { z } from "zod";
import { ai } from "./index";

const AGE_GROUP = z.enum(["1-2", "3-4", "5-6", "7-8", "9-10"]);

const NumberInputSchema = z.object({
  ageGroup: AGE_GROUP,
  theme: z.string().optional().describe("수학 이야기 테마 (예: 동물 농장, 과일 가게, 바닷속)"),
});

const NumberCardSchema = z.object({
  value: z.number(),
  emoji: z.string().describe("숫자만큼 이모지 반복 (예: 3 → 🍎🍎🍎)"),
  korean: z.string().describe("한국어 이름 (고유어: 하나/둘/셋, 또는 한자어: 일/이/삼)"),
  english: z.string().describe("영어 이름 (one, two, three...)"),
  description: z.string().describe("생활 속 예시 (예: 손가락 세 개)"),
});

const MathStorySchema = z.object({
  text: z.string().describe("스토리 지문 (예: 토끼 3마리가 놀고 있었어요. 2마리가 더 왔어요.)"),
  emoji: z.string().describe("이야기를 표현하는 이모지"),
  question: z.string().describe("수학 질문 (예: 모두 몇 마리일까요?)"),
  answer: z.string().describe("정답 (예: 5마리)"),
  explanation: z.string().describe("풀이 과정 (예: 3 + 2 = 5)"),
});

const NumbersCombinedSchema = z.object({
  contentType: z.enum(["numbers_combined"]),
  title: z.string(),
  ageGroup: z.string(),
  numbers: z.array(NumberCardSchema),
  stories: z.array(MathStorySchema).describe("수학 이야기 문제 (어린 연령은 빈 배열)"),
});

// ── 하위 호환 구 타입 ─────────────────────────────────────────
const LegacyCountingSchema = z.object({
  contentType: z.enum(["counting"]),
  title: z.string(),
  ageGroup: z.string(),
  items: z.array(z.object({ value: z.number(), emoji: z.string(), native: z.string(), song: z.string() })),
});
const LegacyNamesSchema = z.object({
  contentType: z.enum(["names"]),
  title: z.string(),
  ageGroup: z.string(),
  numbers: z.array(z.object({ value: z.number(), korean: z.string(), native: z.string(), english: z.string(), emoji: z.string(), funFact: z.string() })),
});
const LegacyOperationsSchema = z.object({
  contentType: z.enum(["operations"]),
  title: z.string(),
  ageGroup: z.string(),
  operations: z.array(z.object({ expression: z.string(), answer: z.number(), explanation: z.string(), emoji: z.string(), type: z.enum(["addition", "subtraction"]) })),
});

export type NumberInput = z.infer<typeof NumberInputSchema>;
export type NumbersCombinedOutput = z.infer<typeof NumbersCombinedSchema>;
export type CountingOutput = z.infer<typeof LegacyCountingSchema>;
export type NamesOutput = z.infer<typeof LegacyNamesSchema>;
export type OperationsOutput = z.infer<typeof LegacyOperationsSchema>;
export type NumbersOutput = NumbersCombinedOutput | CountingOutput | NamesOutput | OperationsOutput;

// ── 연령별 엄격한 사양 ──────────────────────────────────────────────────────
const AGE_SPECS: Record<string, {
  range: string;
  storyCount: number;
  profile: string;
  allowed: string;
  forbidden: string;
  mathLevel: string;
  storyLimit: string;
}> = {
  "1-2": {
    range: "1~3",
    storyCount: 0,
    profile: "1-2세 영아 (시각적 수량 인식 단계, 1~3까지만)",
    allowed: "숫자 1, 2, 3. 이모지로 수량 시각화 (🍎🍎🍎). 고유어(하나, 둘, 셋). 영어(one, two, three)",
    forbidden: "4 이상 숫자, 수식(+/-/=), 계산, 수학 이야기, 비교(많다/적다 제외)",
    mathLevel: "수량 인식만. '하나, 둘, 셋' 세기 수준. 계산 없음",
    storyLimit: "이야기 없음. 숫자 카드만 생성. stories는 빈 배열",
  },
  "3-4": {
    range: "1~5",
    storyCount: 2,
    profile: "3-4세 유아 (1~5 세기, 간단한 더하기 시작)",
    allowed: "1~5 숫자. 간단한 더하기 (합 5 이하: 1+2=3). 이모지 수량 시각화. 고유어+한자어 모두",
    forbidden: "6 이상 숫자, 뺄셈, 곱셈, 나눗셈, 합이 5를 넘는 계산, 추상적 수식 기호",
    mathLevel: "1~5 세기. 구체적 사물로 더하기만 (토끼 2마리 + 1마리 = 3마리). 결과 ≤ 5",
    storyLimit: "이야기 각 2-3문장. 계산 결과는 5 이하. 쉬운 일상 소재",
  },
  "5-6": {
    range: "1~10",
    storyCount: 3,
    profile: "5-6세 유아 (1~10 세기, 10 이하 덧셈)",
    allowed: "1~10 숫자. 덧셈(합 10 이하). 한국어+영어 이름. 이모지 수량 시각화",
    forbidden: "11 이상 숫자, 뺄셈, 곱셈, 나눗셈, 분수, 소수, 합이 10 초과하는 덧셈",
    mathLevel: "1~10 세기. 덧셈만 (합 ≤ 10). 숫자 한/영 이름 학습",
    storyLimit: "이야기 각 3-4문장. 계산 결과는 10 이하. 친근한 소재",
  },
  "7-8": {
    range: "1~20",
    storyCount: 4,
    profile: "7-8세 아동 (초등 저학년, 1~20 연산)",
    allowed: "1~20 숫자. 덧셈(합 20 이하). 뺄셈(차 0 이상). 곱셈표 2단·3단 기초",
    forbidden: "21 이상 숫자, 4단 이상 곱셈, 나눗셈, 분수, 소수, 음수",
    mathLevel: "덧셈·뺄셈 기본 (1~20 범위). 곱셈표 2·3단 시작. 수직선 개념",
    storyLimit: "이야기 각 3-5문장. 덧셈·뺄셈 혼합 가능. 계산 범위 1~20",
  },
  "9-10": {
    range: "다양한 범위",
    storyCount: 5,
    profile: "9-10세 아동 (초등 고학년, 다양한 연산)",
    allowed: "100 이하 덧셈·뺄셈·곱셈 기초. 나눗셈 기초(나머지 없는 간단한 것). 혼합 계산",
    forbidden: "분수 계산, 소수 계산, 방정식, 기하학, 100 초과하는 복잡한 계산",
    mathLevel: "덧셈·뺄셈·곱셈·나눗셈 기초. 100 이하 혼합 계산. 자연스러운 활용",
    storyLimit: "이야기 각 4-6문장. 다양한 연산 혼합. 현실적인 수 활용 상황",
  },
};

export const numbersFlow = ai.defineFlow(
  {
    name: "numbersFlow",
    inputSchema: NumberInputSchema,
  },
  async (input) => {
    const spec = AGE_SPECS[input.ageGroup] ?? AGE_SPECS["5-6"];
    const theme = input.theme ?? "동물";

    if (input.ageGroup === "1-2") {
      const { output } = await ai.generate({
        prompt: `유아 숫자 학습 카드를 생성하세요.

【대상】 ${spec.profile}
【테마】 "${theme}"
【숫자 범위】 ${spec.range}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 엄격한 규칙】

✅ 사용 가능: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 수학 수준: ${spec.mathLevel}
📏 이야기 제한: ${spec.storyLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【출력 형식】
- numbers 배열에 숫자 1, 2, 3 각각 생성
- emoji는 테마에 맞는 이모지를 value만큼 반복 (예: value:2, 테마:동물 → "🐶🐶")
- korean에는 고유어(하나/둘/셋)
- english에는 영어 이름(one/two/three)
- description은 생활 속 쉬운 예시 (2-3단어)
- stories는 빈 배열([])

⚠️ 생성 전 자가 검토: 위 규칙을 모두 만족하는지 확인 후 출력하세요.`,
        output: { schema: NumbersCombinedSchema },
      });
      return { ...(output as NumbersCombinedOutput), ageGroup: input.ageGroup, contentType: "numbers_combined" as const };
    }

    const { output } = await ai.generate({
      prompt: `유아/아동 숫자 학습 자료를 생성하세요.

【대상】 ${spec.profile}
【테마】 "${theme}"
【숫자 범위】 ${spec.range}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【반드시 지켜야 할 엄격한 규칙】

✅ 사용 가능: ${spec.allowed}
❌ 절대 금지: ${spec.forbidden}
📏 수학 수준: ${spec.mathLevel}
📏 이야기 제한: ${spec.storyLimit}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【생성 내용】

1. numbers 배열에 ${spec.range} 범위의 숫자 카드 생성:
   - emoji는 테마에 맞는 이모지를 value만큼 반복 (예: value:3, 테마:동물 → "🐶🐶🐶")
   - korean에는 고유어(하나/둘/셋...) 또는 한자어(일/이/삼...) 사용
   - english에는 영어 이름(one/two/three...) 사용
   - description은 생활 속 쉬운 예시로 작성

2. stories 배열에 "${theme}" 테마의 수학 이야기 문제 ${spec.storyCount}개:
   - ${spec.storyLimit}
   - 풀이 과정(explanation)을 아이 눈높이에서 쉽게 설명
   - ${input.ageGroup === "7-8" || input.ageGroup === "9-10" ? "덧셈과 뺄셈을 모두 포함하세요" : "간단한 덧셈으로 구성하세요"}
   - 반드시 위 수학 수준과 금지 항목을 지키세요

⚠️ 생성 전 자가 검토: 모든 숫자와 계산이 ${input.ageGroup}세 수준에 맞는지 확인 후 출력하세요.
금지 항목 위반 시 더 쉬운 내용으로 교체하세요.`,
      output: { schema: NumbersCombinedSchema },
    });
    return { ...(output as NumbersCombinedOutput), ageGroup: input.ageGroup, contentType: "numbers_combined" as const };
  }
);
