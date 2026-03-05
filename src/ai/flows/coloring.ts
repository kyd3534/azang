import { z } from "zod";
import { ai } from "./index";

const ColoringInputSchema = z.object({
  subject: z.string().describe("색칠 주제 (예: 귀여운 강아지, 우주선, 꽃밭)"),
});

const ColoringOutputSchema = z.object({
  title: z.string(),
  svgContent: z.string().describe("색칠 가능한 SVG 코드 (viewBox 포함, 윤곽선만, fill=none 또는 fill=white)"),
});

export type ColoringInput = z.infer<typeof ColoringInputSchema>;
export type ColoringOutput = z.infer<typeof ColoringOutputSchema>;

export const coloringFlow = ai.defineFlow(
  {
    name: "coloringFlow",
    inputSchema: ColoringInputSchema,
    outputSchema: ColoringOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `아이들이 색칠할 수 있는 SVG 도안을 만들어주세요.

주제: "${input.subject}"

SVG 요구사항:
- viewBox="0 0 400 400" 사용
- 모든 도형은 stroke="black" stroke-width="2" fill="white" 또는 fill="none"
- 단순하고 큰 형태로 그려서 아이가 색칠하기 쉽게
- 복잡한 세부사항 없이 명확한 윤곽선만
- 배경은 흰색
- 완전한 SVG 태그(xmlns 포함)로 감싸기

제목도 함께 반환하세요.`,
      output: { schema: ColoringOutputSchema },
    });

    return output!;
  }
);
