import { z } from "zod";
import { ai } from "./index";
import { DEVELOPMENTAL_CONTEXT, STORY_GRAMMAR_LEVEL } from "../pedagogy";
import type { AgeGroup } from "../pedagogy";

const StoryInputSchema = z.object({
  theme: z.string().describe("동화 주제 또는 아이디어 (예: 마법의 씨앗, 용감한 토끼)"),
  ageGroup: z.enum(["1-2", "3-4", "5-6", "7-8", "9-10"]).describe("아이 연령대"),
});

const SectionSchema = z.object({
  type: z.enum(["기", "승", "전", "결"]),
  paragraphs: z.array(z.string()).describe("이 섹션의 문단 목록 (각 문단은 TTS로 읽힐 단위)"),
});

const StoryOutputSchema = z.object({
  title: z.string().describe("동화 제목"),
  sections: z.array(SectionSchema).describe("기승전결 4개 섹션"),
  moral: z.string().describe("동화의 교훈 (1-2문장)"),
  storyTheme: z.enum(["모험", "마법", "우정", "자연", "동물", "우주", "바다", "노래"]).describe("동화의 주제 카테고리"),
});

export type StoryInput = z.infer<typeof StoryInputSchema>;
export type StoryOutput = z.infer<typeof StoryOutputSchema>;
export type StorySection = z.infer<typeof SectionSchema>;

// ── 연령별 서사 전략 (발달 이론 기반) ────────────────────────────────────────
const STORY_AGE_SPEC: Record<AgeGroup, {
  paragraphCount: string;        // 섹션별 문단 수 가이드
  sentenceLength: string;        // 문장 길이
  vocabulary: string;            // 어휘 수준
  narrativeDevice: string;       // 서사 장치
  forbidden: string;             // 절대 금지
  writingStyle: string;          // 문체
}> = {
  "1-2": {
    paragraphCount: "기(2문단) 승(2문단) 전(2문단) 결(2문단) — 총 8문단",
    sentenceLength: "문단당 1-2문장. 문장당 5-8어절 이내",
    vocabulary: "의성어·의태어 풍부 (뒤뚱뒤뚱, 퐁당, 까르르, 야옹야옹). 일상 명사만 사용",
    narrativeDevice: "반복 구조 필수 (같은 문장 패턴 3회 반복). 리듬감 있는 문장. 소리 묘사",
    forbidden: "복잡한 인과관계, 시제 변화, 추상적 교훈, 복선, 2개 이상 동시 사건, 부정문 남발",
    writingStyle: "현재형. 직접 대화체 많이. '~해요/~이에요' 종결어미. 감탄사 활용",
  },
  "3-4": {
    paragraphCount: "기(2-3문단) 승(3문단) 전(3문단) 결(2문단) — 총 10-11문단",
    sentenceLength: "문단당 2-3문장. 문장당 8-12어절 이내",
    vocabulary: "친숙한 동물·음식·장소 어휘. 감정 어휘 필수 (기뻐요, 슬퍼요, 무서워요, 신나요)",
    narrativeDevice: "단순 인과 (이래서→저렇게 됐어요). 반복 패턴 1-2회. 의성어 유지",
    forbidden: "복잡한 도덕적 딜레마, 죽음/이별, 추상 개념, 2개 이상 서브플롯, 긴 묘사 단락",
    writingStyle: "현재형/과거형 혼용 가능. 주인공 감정 명시적 표현. 대화 많이 포함",
  },
  "5-6": {
    paragraphCount: "기(3-4문단) 승(4-5문단) 전(4-5문단) 결(3-4문단) — 총 14-18문단",
    sentenceLength: "문단당 3-4문장. 문장당 15어절 이내",
    vocabulary: "초등 전 어휘 + 약간의 새 단어(맥락으로 이해 가능). 색감·소리·촉감 묘사어",
    narrativeDevice: "완전한 기승전결. 장애물 1-2개. 조력자 등장. 절정 장면 생생하게",
    forbidden: "과도한 폭력/공포, 복잡한 세계관 설명, 10명 이상 등장인물, 비극적 결말, 직접적 교훈 설명",
    writingStyle: "생생한 장면 묘사. 인물 대사로 성격 드러내기. 감각적 표현 풍부하게",
  },
  "7-8": {
    paragraphCount: "기(4-5문단) 승(5-6문단) 전(5-6문단) 결(4-5문단) — 총 18-22문단",
    sentenceLength: "문단당 4-5문장. 문장당 20어절 이내. 복합문 가능",
    vocabulary: "초등 1-2학년 수준 + 맥락으로 추론 가능한 새 단어. 한자어 적절히 포함",
    narrativeDevice: "다층 갈등(내적+외적). 인물 심리 묘사. 복선 1-2개. 도덕적 선택 순간",
    forbidden: "초등 이상 전문어, 성인 관계 묘사, 지나친 폭력, 희망 없는 결말",
    writingStyle: "심리 묘사 포함. 대화로 성격 차이 드러내기. 반전 장면 극적으로",
  },
  "9-10": {
    paragraphCount: "기(5-6문단) 승(6-7문단) 전(6-7문단) 결(5-6문단) — 총 22-26문단",
    sentenceLength: "문단당 5-6문장. 자연스러운 길이. 복합문·종속절 자유롭게",
    vocabulary: "초등 3-4학년 수준. 속담·관용어 1-2개 가능. 비유·은유 활용",
    narrativeDevice: "캐릭터 아크(성장·변화). 복합 주제. 상징 1-2개. 사회적 메시지",
    forbidden: "성인용 주제, 과도한 폭력, 희망 없는 결말, 실존적 공허감, 부정적 편견 조장",
    writingStyle: "세계 명작 수준 묘사. 불완전한 주인공(결점 있음)이 더 공감. 독자가 생각하게 하는 결말",
  },
};

export const storyFlow = ai.defineFlow(
  {
    name: "storyFlow",
    inputSchema: StoryInputSchema,
    outputSchema: StoryOutputSchema,
  },
  async (input) => {
    const age = input.ageGroup as AgeGroup;
    const spec = STORY_AGE_SPEC[age];
    const devCtx = DEVELOPMENTAL_CONTEXT[age];
    const grammarLevel = STORY_GRAMMAR_LEVEL[age];

    const { output } = await ai.generate({
      prompt: `당신은 그림 형제, 안데르센, 샤를 페로와 같은 세계적인 명작 동화 작가입니다.
아동 발달 심리학을 깊이 이해하는 전문 아동 문학가로서, 연령에 딱 맞는 이야기를 창작하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【발달 단계 이해】
${devCtx}

【서사 발달 수준】
${grammarLevel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【창작 요청】
주제/아이디어: "${input.theme}"
대상 연령: ${input.ageGroup}세

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【교수법 원칙 — 반드시 준수】

📏 구성: ${spec.paragraphCount}
📏 문장 길이: ${spec.sentenceLength}
📖 어휘 수준: ${spec.vocabulary}
🎭 서사 장치: ${spec.narrativeDevice}
✍️ 문체: ${spec.writingStyle}

❌ 절대 금지: ${spec.forbidden}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【기승전결 구조】
- 기(起): 주인공·세계관 소개, 일상의 시작 → 문제 암시
- 승(承): 사건 발단, 모험/갈등 시작, 긴장감 고조
- 전(轉): 위기와 반전, 클라이맥스, 가장 극적인 순간
- 결(結): 문제 해결, 교훈 자연스럽게 녹아든 결말

【창작 지침】
- 주인공에게 개성 있는 이름과 외모·성격을 부여하세요
- 색깔·냄새·소리로 장면을 그림처럼 묘사하세요
- 인물 대사로 성격 차이를 드러내세요
- 교훈은 절대 직접 설명하지 말고 행동과 결과로 보여주세요
- 한국어로 작성하세요

storyTheme은 이야기의 핵심 주제를 선택하세요:
모험(탐험·도전), 마법(마법사·요정·주문), 우정(친구·우애·협력), 자연(숲·꽃·계절),
동물(동물 주인공), 우주(별·행성·우주선), 바다(바닷속·인어·물고기), 노래(음악·춤·소리)`,
      output: { schema: StoryOutputSchema },
    });

    return output!;
  }
);
