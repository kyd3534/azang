import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

/**
 * Genkit 전역 인스턴스 — 모든 AI Flow에서 공유
 * 순환 참조 방지를 위해 flow 파일은 여기서 import하지 않음
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_AI_API_KEY }),
  ],
  model: "googleai/gemini-2.5-flash",
});
