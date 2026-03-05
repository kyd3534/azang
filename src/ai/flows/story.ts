import { z } from "zod";
import { ai } from "./index";

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
});

export type StoryInput = z.infer<typeof StoryInputSchema>;
export type StoryOutput = z.infer<typeof StoryOutputSchema>;
export type StorySection = z.infer<typeof SectionSchema>;

const AGE_GUIDE: Record<string, string> = {
  "1-2": "만 1~2세 아이 대상. 각 문단은 1~2문장. 짧고 리드미컬한 문장, 의성어·의태어(뒤뚱뒤뚱, 퐁당, 까르르) 풍부하게 사용. 반복 구조 강조.",
  "3-4": "만 3~4세 아이 대상. 각 문단은 2~3문장. 친근한 동물 캐릭터와 단순한 사건. 재미있는 표현과 소리 묘사 포함.",
  "5-6": "만 5~6세 아이 대상. 각 문단은 3~4문장. 흥미로운 모험과 따뜻한 감정. 생생한 묘사와 등장인물의 대사 포함.",
  "7-8": "만 7~8세 아이 대상. 각 문단은 4~5문장. 교훈이 자연스럽게 담긴 풍부한 이야기. 인물의 감정 변화와 성장 묘사.",
  "9-10": "만 9~10세 아이 대상. 각 문단은 5~6문장. 세계 명작 수준의 풍부한 묘사와 감동. 복잡한 감정과 도덕적 갈등 포함.",
};

export const storyFlow = ai.defineFlow(
  {
    name: "storyFlow",
    inputSchema: StoryInputSchema,
    outputSchema: StoryOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `당신은 그림 형제, 안데르센, 샤를 페로와 같은 세계적인 명작 동화 작가입니다.
신데렐라, 백설공주, 헨젤과 그레텔, 인어공주, 피노키오, 장화 신은 고양이처럼
기억에 남는 캐릭터와 따뜻한 감동을 주는 이야기를 창작하세요.

주제/아이디어: "${input.theme}"
연령 가이드: ${AGE_GUIDE[input.ageGroup]}

기승전결(起承轉結) 4개 섹션으로 작성하세요:
- 기(起): 주인공과 세계관 소개, 평화로운 일상의 시작 (3~4문단)
- 승(承): 사건의 발단, 모험 또는 갈등의 시작, 긴장감 고조 (4~5문단)
- 전(轉): 위기와 반전, 가장 극적인 순간, 클라이맥스 (4~5문단)
- 결(結): 문제 해결, 교훈 습득, 따뜻하고 희망찬 결말 (3~4문단)

창작 지침:
- 연령 가이드에 맞는 문단 길이와 언어 수준으로 작성
- 주인공의 이름을 지어주고 개성 있게 묘사하세요
- 생생한 장면 묘사(색깔, 냄새, 소리)로 그림이 그려지게 하세요
- 인물의 대사를 자연스럽게 넣어 생동감을 더하세요
- 세계 명작처럼 기억에 남는 반전이나 감동적인 장면을 포함하세요
- 한국어로 작성하세요`,
      output: { schema: StoryOutputSchema },
    });

    return output!;
  }
);
