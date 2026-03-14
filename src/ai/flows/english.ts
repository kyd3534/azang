import { z } from "zod";
import { ai } from "./index";
import { DEVELOPMENTAL_CONTEXT, ENGLISH_PEDAGOGY } from "../pedagogy";
import type { AgeGroup } from "../pedagogy";

const AGE_GROUP = z.enum(["1-2", "3-4", "5-6", "7-8", "9-10"]);

const EnglishInputSchema = z.object({
  ageGroup: AGE_GROUP,
  topic: z.string().optional().describe("주제 (예: 동물, 학교, 가족)"),
});

// ─── 연령별 스키마 ──────────────────────────────────────────────────────────

/** 🍼 1-2세 — 소리·이미지 연결 카드 */
const SoundImageSchema = z.object({
  contentType: z.enum(["sound_image"]),
  title: z.string(),
  ageGroup: z.string(),
  theme: z.string(),
  words: z.array(z.object({
    word: z.string(),
    tts_text: z.string().describe("느리고 반복적인 TTS 텍스트 (예: dog~~ dog~~)"),
    image_query: z.string().describe("이미지 API용 영문 키워드 (예: cute puppy dog photo)"),
    rhyme_hint: z.string().optional().describe("운율 단어 (예: dog, log, frog)"),
    emoji: z.string(),
  })),
  repeat_count: z.number().default(3),
  parent_tip: z.string().describe("부모를 위한 10단어 이내 활동 팁"),
});

/** 🐥 3-4세 — 알파벳·파닉스 씨앗 */
const AlphabetPhonicsSchema = z.object({
  contentType: z.enum(["alphabet_phonics"]),
  title: z.string(),
  ageGroup: z.string(),
  letter: z.object({
    char: z.string().describe("대문자 알파벳 1개"),
    sound: z.string().describe("IPA 발음 기호 (예: /b/)"),
    mnemonic: z.string().describe("연상 문구 (예: B is for Ball! Buh-buh-Ball!)"),
    image_query: z.string(),
    tts_intro: z.string(),
    mouth_tip: z.string().describe("입 모양 힌트 (예: Press lips together, then pop!)"),
  }),
  sight_word: z.object({
    word: z.string().describe("Dolch Pre-primer 단어"),
    tts: z.string(),
    sentence: z.string().describe("최대 4단어 예문"),
  }),
  words: z.array(z.object({
    word: z.string(),
    emoji: z.string(),
    breakdown: z.object({
      onset: z.string().describe("어두 자음 (예: b)"),
      rime: z.string().describe("모음+이후 (예: all)"),
      colors: z.array(z.string()).describe("각 음소 색깔 (blue=자음, red=모음)"),
    }),
    image_query: z.string(),
    example_sentence: z.string().describe("최대 5단어"),
  })).describe("4개 CVC 단어"),
  story: z.object({
    title: z.string(),
    lines: z.array(z.string()).describe("3-4줄"),
    repeat_phrase: z.string().describe("반복 구문 (예: B~ B~ Ball!)"),
    emotion_end: z.string().describe("마지막 감정 문장"),
  }),
  rhyme_set: z.array(z.string()).describe("운율 단어 3개"),
});

/** 🐰 5-6세 — 체계적 파닉스 완성 */
const PhonicsSystematicSchema = z.object({
  contentType: z.enum(["phonics_systematic"]),
  title: z.string(),
  ageGroup: z.string(),
  focus: z.object({
    type: z.string().describe("short_vowel | blend | digraph"),
    pattern: z.string().describe("예: short_a, st_blend, sh_digraph"),
    example_word: z.string(),
    rule_plain: z.string().describe("아이 눈높이 1문장 규칙"),
    color_decode: z.object({
      word: z.string(),
      parts: z.array(z.object({
        char: z.string(),
        role: z.string().describe("consonant | vowel | blend | digraph"),
        color: z.string().describe("blue | red | green"),
      })),
      blend_guide: z.string().describe("예: sss-ttt-op → stop"),
    }),
  }),
  sight_word: z.object({
    word: z.string().describe("Dolch primer/grade1 단어"),
    cannot_decode: z.boolean().default(true),
    memory_tip: z.string().describe("시각적 기억법 (예: SAID has AI in the middle)"),
  }),
  words: z.array(z.object({
    word: z.string(),
    emoji: z.string(),
    syllable_count: z.number(),
    color_parts: z.array(z.object({
      char: z.string(),
      color: z.string(),
    })),
    image_query: z.string(),
    example: z.string().describe("6-8단어"),
  })).describe("5개 단어"),
  minimal_pairs: z.array(z.object({
    word_a: z.string(),
    word_b: z.string(),
    difference: z.string(),
  })).describe("소리 변별 쌍 2개"),
  story: z.object({
    title: z.string(),
    lines: z.array(z.string()).describe("5-6줄"),
    pattern_word_count: z.number().describe("패턴 단어 등장 횟수"),
    comprehension_q: z.string(),
  }),
});

/** 🦊 7-8세 — 독립 독해 + 유창성 */
const ReadingFluencySchema = z.object({
  contentType: z.enum(["reading_fluency"]),
  title: z.string(),
  ageGroup: z.string(),
  word_study: z.object({
    focus: z.string().describe("multi_syllable | prefix | suffix"),
    target: z.string().describe("예: un- 또는 yesterday"),
    rule: z.string().describe("예: un- means NOT or OPPOSITE"),
    examples: z.array(z.object({
      word: z.string(),
      breakdown: z.string().describe("예: un-happy"),
      meaning: z.string(),
    })).describe("3개"),
    stress_pattern: z.string().describe("예: YES-ter-day (stress on 1st)"),
  }),
  vocabulary: z.array(z.object({
    word: z.string(),
    emoji: z.string(),
    syllables: z.string().describe("예: ad-ven-ture"),
    pos: z.string(),
    definition: z.string().describe("10단어 이내"),
    context_clue_sentence: z.string().describe("문맥으로 의미 추론 가능한 문장"),
    word_family: z.array(z.string()).describe("2-3개"),
    image_query: z.string(),
  })).describe("6개"),
  passage: z.object({
    title: z.string(),
    genre: z.string().describe("narrative | informational | procedural"),
    line_count: z.number(),
    text: z.string().describe("8-10줄 완전한 지문. 6개 어휘 모두 자연스럽게 포함"),
    fluency_note: z.string().describe("읽기 팁 (예: Pause at every comma)"),
  }),
  questions: z.array(z.object({
    type: z.string().describe("literal | inferential"),
    question: z.string(),
    answer: z.string().optional(),
    text_location: z.string().optional(),
    thinking_prompt: z.string().optional(),
    sample_answer: z.string().optional(),
  })).describe("2개 질문"),
  activity: z.object({
    type: z.string().default("word_map"),
    center_word: z.string(),
    branches: z.array(z.string()).describe("definition, synonym, antonym, my_sentence"),
  }),
});

/** 🦁 9-10세 — 학술 문해력 */
const AcademicLiteracySchema = z.object({
  contentType: z.enum(["academic_literacy"]),
  title: z.string(),
  ageGroup: z.string(),
  theme: z.string(),
  vocabulary: z.array(z.object({
    word: z.string(),
    emoji: z.string(),
    tier: z.number().describe("1=일상 2=학술 3=전공"),
    etymology: z.string().describe("어원 (예: Latin: ecosystema = eco+systema)"),
    definition: z.string(),
    pos: z.string(),
    example_1: z.string().describe("일상적 문맥"),
    example_2: z.string().describe("학술적 문맥"),
    word_family: z.array(z.string()),
    collocations: z.array(z.string()).describe("자주 쓰이는 결합어 (예: complex ecosystem)"),
  })).describe("8개 (일반 4개 + 학술 4개)"),
  passage: z.object({
    title: z.string(),
    genre: z.string().describe("informational | narrative | persuasive"),
    text_structure: z.string().describe("cause_effect | compare_contrast | problem_solution | chronological"),
    line_count: z.number(),
    text: z.string().describe("13-15줄 완전한 지문. 8개 어휘 모두 포함"),
    text_features: z.object({
      topic_sentence: z.string(),
      thesis_or_claim: z.string(),
      key_evidence: z.array(z.string()).describe("2-3개"),
    }),
  }),
  questions: z.array(z.object({
    type: z.string().describe("literal | inferential | critical"),
    question: z.string(),
    answer: z.string().optional(),
    evidence_prompt: z.string().optional(),
    sample_answer: z.string().optional(),
    sentence_starters: z.array(z.string()).optional(),
    ai_feedback_rubric: z.object({
      "3pts": z.string(),
      "2pts": z.string(),
      "1pt": z.string(),
    }).optional(),
  })).describe("3개 질문 (literal + inferential + critical)"),
  fill_in_blank: z.array(z.string()).describe("빈칸 채우기 2문장 (___로 표시)"),
  extension: z.object({
    type: z.string().default("research_prompt"),
    prompt: z.string().describe("더 알아보기 질문 1개"),
    search_safe: z.boolean().default(true),
  }),
});

// ── 하위 호환 구 타입 (DB 저장된 기존 데이터용) ──────────────────────────
const LegacyCombinedSchema = z.object({
  contentType: z.enum(["combined"]),
  title: z.string(),
  ageGroup: z.string(),
  words: z.array(z.object({
    word: z.string(),
    pronunciation: z.string(),
    meaning: z.string(),
    emoji: z.string(),
    exampleSentence: z.string(),
    exampleTranslation: z.string(),
  })),
  situation: z.string(),
  dialogue: z.array(z.object({
    speaker: z.enum(["A", "B"]),
    speakerName: z.string(),
    text: z.string(),
    translation: z.string(),
  })),
});

export type SoundImageOutput = z.infer<typeof SoundImageSchema>;
export type AlphabetPhonicsOutput = z.infer<typeof AlphabetPhonicsSchema>;
export type PhonicsSystematicOutput = z.infer<typeof PhonicsSystematicSchema>;
export type ReadingFluencyOutput = z.infer<typeof ReadingFluencySchema>;
export type AcademicLiteracyOutput = z.infer<typeof AcademicLiteracySchema>;
export type CombinedOutput = z.infer<typeof LegacyCombinedSchema>;

export type EnglishInput = z.infer<typeof EnglishInputSchema>;

// Backward compat legacy types
export type WordsOutput = {
  contentType: "words";
  title: string;
  ageGroup: string;
  words: CombinedOutput["words"];
};
export type DialogueOutput = {
  contentType: "dialogue";
  title: string;
  ageGroup: string;
  situation: string;
  lines: CombinedOutput["dialogue"];
  vocabulary: { word: string; meaning: string }[];
};
export type SentencesOutput = {
  contentType: "sentences";
  title: string;
  ageGroup: string;
  sentences: { sentence: string; translation: string; pattern: string; emoji: string; practice: string }[];
};

export type EnglishOutput =
  | SoundImageOutput
  | AlphabetPhonicsOutput
  | PhonicsSystematicOutput
  | ReadingFluencyOutput
  | AcademicLiteracyOutput
  | CombinedOutput
  | WordsOutput
  | DialogueOutput
  | SentencesOutput;

// ── 연령별 교육 전략 ────────────────────────────────────────────────────────
const AGE_SPECS = {
  "1-2": {
    wordCount: 3,
    theory: "Pre-linguistic stage. Brain wiring phoneme maps. Sound+image+emotion=memory. Repetition IS the lesson. No alphabet names — only sounds and rhythm.",
    curriculum: ["Sound awareness", "Rhyme play", "1-3 daily words", "TTS repeat 3+"],
    rules: `- words array MAX 3
- No sentences ever
- No alphabet letter names
- No spelling activities
- image_query must be English, photo-friendly
- tts_text: slow, warm, repetitive (e.g. "dog~~ dog~~")
- rhyme_hint: include if easy rhyme exists (e.g. "dog, log, frog")
- parent_tip: 10 words max (e.g. "Point to real objects as you play!")`,
  },
  "3-4": {
    wordCount: 4,
    theory: "Language explosion. Vocabulary grows 5-10 words/day. Phonological awareness: can hear that 'cat' and 'hat' rhyme. Alphabet shape recognition begins. Play = learning.",
    curriculum: ["대문자 인식", "Letter-Sound 1:1 매핑", "CVC 단어 (cat, dog, big)", "단순 문장 1개", "Sight word 1개/레슨"],
    rules: `- Only CVC words (consonant-vowel-consonant)
- No silent letters, no blends (sh, ch, th)
- story.lines: 3-4 ONLY, simple subject-verb
- sight_word from Dolch pre-primer: the, a, and, is, in, it, big, can, go, see
- breakdown.onset = initial consonant, breakdown.rime = vowel+ending
- colors array: ["blue","red","blue"] pattern for CVC`,
  },
  "5-6": {
    wordCount: 5,
    theory: "Phonemic awareness peak. Can segment phonemes: /k/-/æ/-/t/ = cat. Ready for systematic phonics: short vowels → long vowels → blends → digraphs. Sight word bank: 50-100 words.",
    curriculum: ["단모음 5개 (a,e,i,o,u)", "자음 블렌드 (st,bl,cr,dr)", "이중자음 digraphs (sh,ch,th,wh)", "Sight words 50개", "5-6줄 이야기 + 이해 질문 1개"],
    rules: `- minimal_pairs: 2 pairs showing today's pattern vs another
- blend_guide: phoneme-by-phoneme then fast blend
- story: pattern words appear minimum 4 times
- comprehension_q: literal, single-word answer OK
- color_parts: blue=consonant, red=vowel, green=blend/digraph`,
  },
  "7-8": {
    wordCount: 6,
    theory: "Transitioning from 'learning to read' to 'reading to learn.' Phonics complete. Now: fluency, vocabulary depth, comprehension strategies. Multi-syllable words. Prefixes/suffixes.",
    curriculum: ["다음절 단어 분해", "접두사 un-/re-/pre-/dis-", "접미사 -ful/-less/-ness", "Context clues", "8-10줄 지문 + 추론 질문"],
    rules: `- passage.text: FULL 8-10 line passage, include ALL 6 vocabulary words naturally
- questions: literal (factual) + inferential (thinking required)
- activity.branches: ["definition","synonym","antonym","my_sentence"]
- word_study: show prefix/suffix/multi-syllable rule with 3 examples
- context_clue_sentence: meaning hinted but not stated explicitly`,
  },
  "9-10": {
    wordCount: 8,
    theory: "Academic language acquisition. Tier 2 vocabulary (analyze, describe, compare) critical for school success. Genre awareness. Critical thinking and opinion writing begin. Etymology helps retention.",
    curriculum: ["Tier 2 학술 어휘", "어원(etymology)", "3개 장르 읽기", "13-15줄 지문", "비판적 사고 질문", "Fill-in-blank"],
    rules: `- vocabulary: 4 general (tier1-2) + 4 academic (tier2-3)
- passage.text: FULL 13-15 line passage, ALL 8 vocab words used naturally
- questions[2] MUST be critical type with ai_feedback_rubric
- fill_in_blank: 2 sentences with ___ for vocab practice
- extension.prompt: 1 question to explore further (no external links)`,
  },
} as const;

export const englishFlow = ai.defineFlow(
  {
    name: "englishFlow",
    inputSchema: EnglishInputSchema,
  },
  async (input) => {
    const age = input.ageGroup as AgeGroup;
    const spec = AGE_SPECS[age];
    const devCtx = DEVELOPMENTAL_CONTEXT[age];
    const pedagogy = ENGLISH_PEDAGOGY[age];
    const topic = input.topic ?? "everyday life";

    // ── 🍼 1-2세 ────────────────────────────────────────────────────────
    if (age === "1-2") {
      const { output } = await ai.generate({
        config: { temperature: 0.3 },
        prompt: `You are a warm, expert early childhood English teacher.
Output ONLY valid JSON matching the schema. No preamble, no markdown fences.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[DEVELOPMENTAL THEORY]
${devCtx}

[PEDAGOGY]
${pedagogy}

Theory: ${spec.theory}
Curriculum goals: ${spec.curriculum.join(" · ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INPUT]
Topic: "${topic}"
Age: 1-2 years

[SCHEMA]
{
  "contentType": "sound_image",
  "title": string,
  "ageGroup": "1-2",
  "theme": string,
  "words": [              // MAX 3
    {
      "word": string,     // simple CVC or single syllable
      "tts_text": string, // e.g. "dog~~ dog~~"
      "image_query": string, // English, photo-friendly
      "rhyme_hint": string,  // optional: "dog, log, frog"
      "emoji": string
    }
  ],
  "repeat_count": 3,
  "parent_tip": string    // 10 words max
}

[RULES]
${spec.rules}

⚠️ Self-check before output: All words ≤ 2 syllables? No sentences? JSON valid?`,
        output: { schema: SoundImageSchema },
      });
      return { ...(output as SoundImageOutput), ageGroup: input.ageGroup };
    }

    // ── 🐥 3-4세 ────────────────────────────────────────────────────────
    if (age === "3-4") {
      const { output } = await ai.generate({
        config: { temperature: 0.7 },
        prompt: `You are a playful phonics teacher for preschoolers.
Output ONLY valid JSON. No preamble, no markdown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[DEVELOPMENTAL THEORY]
${devCtx}

[PEDAGOGY]
${pedagogy}

Theory: ${spec.theory}
Curriculum: ${spec.curriculum.join(" · ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INPUT]
Topic: "${topic}"
Age: 3-4 years

[SCHEMA]
{
  "contentType": "alphabet_phonics",
  "title": string,
  "ageGroup": "3-4",
  "letter": {
    "char": string,          // ONE uppercase letter
    "sound": string,         // IPA: "/b/"
    "mnemonic": string,      // "B is for Ball! Buh-buh-Ball!"
    "image_query": string,
    "tts_intro": string,     // "B says /b/~ like Ball~ Ball~"
    "mouth_tip": string      // "Press lips together, then pop!"
  },
  "sight_word": {
    "word": string,          // Dolch pre-primer
    "tts": string,
    "sentence": string       // max 4 words
  },
  "words": [                 // 4 CVC words with the letter sound
    {
      "word": string,
      "emoji": string,
      "breakdown": {
        "onset": string,     // initial consonant(s)
        "rime": string,      // vowel + ending
        "colors": [string]   // e.g. ["blue","red","blue"]
      },
      "image_query": string,
      "example_sentence": string  // max 5 words
    }
  ],
  "story": {
    "title": string,
    "lines": [string],       // 3-4 ONLY
    "repeat_phrase": string, // e.g. "B~ B~ Ball!"
    "emotion_end": string    // feeling word at end
  },
  "rhyme_set": [string]      // 3 rhyming words
}

[RULES]
${spec.rules}

⚠️ Self-check: Only CVC words? Story 3-4 lines? Rhyme set has 3 words? JSON valid?`,
        output: { schema: AlphabetPhonicsSchema },
      });
      return { ...(output as AlphabetPhonicsOutput), ageGroup: input.ageGroup };
    }

    // ── 🐰 5-6세 ────────────────────────────────────────────────────────
    if (age === "5-6") {
      const { output } = await ai.generate({
        config: { temperature: 0.65 },
        prompt: `You are a systematic phonics teacher. Children can now blend sounds into words.
Output ONLY valid JSON. No preamble, no markdown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[DEVELOPMENTAL THEORY]
${devCtx}

[PEDAGOGY]
${pedagogy}

Theory: ${spec.theory}
Curriculum: ${spec.curriculum.join(" · ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INPUT]
Topic: "${topic}"
Age: 5-6 years

[SCHEMA]
{
  "contentType": "phonics_systematic",
  "title": string,
  "ageGroup": "5-6",
  "focus": {
    "type": "short_vowel"|"blend"|"digraph",
    "pattern": string,       // e.g. "short_a", "st_blend", "sh_digraph"
    "example_word": string,
    "rule_plain": string,    // 1 sentence, child-friendly
    "color_decode": {
      "word": string,
      "parts": [{"char":string,"role":string,"color":string}],
      "blend_guide": string  // e.g. "c-a-t → cat"
    }
  },
  "sight_word": {
    "word": string,          // Dolch primer/grade1
    "cannot_decode": true,
    "memory_tip": string     // visual trick
  },
  "words": [                 // 5 words following the pattern
    {
      "word": string,
      "emoji": string,
      "syllable_count": number,
      "color_parts": [{"char":string,"color":string}],
      "image_query": string,
      "example": string      // 6-8 words
    }
  ],
  "minimal_pairs": [         // 2 pairs for sound discrimination
    {"word_a":string,"word_b":string,"difference":string}
  ],
  "story": {
    "title": string,
    "lines": [string],       // 5-6 lines
    "pattern_word_count": number,
    "comprehension_q": string
  }
}

[RULES]
${spec.rules}

⚠️ Self-check: Pattern words appear 4+ times in story? 2 minimal pairs? JSON valid?`,
        output: { schema: PhonicsSystematicSchema },
      });
      return { ...(output as PhonicsSystematicOutput), ageGroup: input.ageGroup };
    }

    // ── 🦊 7-8세 ────────────────────────────────────────────────────────
    if (age === "7-8") {
      const { output } = await ai.generate({
        config: { temperature: 0.7 },
        prompt: `You are a reading comprehension teacher building fluency and inferential thinking.
Output ONLY valid JSON. No preamble, no markdown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[DEVELOPMENTAL THEORY]
${devCtx}

[PEDAGOGY]
${pedagogy}

Theory: ${spec.theory}
Curriculum: ${spec.curriculum.join(" · ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INPUT]
Topic: "${topic}"
Age: 7-8 years

[SCHEMA]
{
  "contentType": "reading_fluency",
  "title": string,
  "ageGroup": "7-8",
  "word_study": {
    "focus": "multi_syllable"|"prefix"|"suffix",
    "target": string,        // e.g. "un-" or "yesterday"
    "rule": string,          // "un- means NOT or OPPOSITE"
    "examples": [{"word":string,"breakdown":string,"meaning":string}],  // 3 items
    "stress_pattern": string // e.g. "YES-ter-day (stress on 1st syllable)"
  },
  "vocabulary": [            // 6 words
    {
      "word": string,
      "emoji": string,
      "syllables": string,   // e.g. "ad-ven-ture"
      "pos": string,
      "definition": string,  // max 10 words
      "context_clue_sentence": string,
      "word_family": [string],  // 2-3
      "image_query": string
    }
  ],
  "passage": {
    "title": string,
    "genre": "narrative"|"informational"|"procedural",
    "line_count": 9,
    "text": string,          // FULL 8-10 line passage. ALL 6 vocab words included naturally.
    "fluency_note": string
  },
  "questions": [             // 2 questions
    {
      "type": "literal",
      "question": string,
      "answer": string,
      "text_location": string
    },
    {
      "type": "inferential",
      "question": string,
      "thinking_prompt": string,  // "The text says X... so maybe..."
      "sample_answer": string
    }
  ],
  "activity": {
    "type": "word_map",
    "center_word": string,
    "branches": ["definition","synonym","antonym","my_sentence"]
  }
}

[RULES]
${spec.rules}

⚠️ Self-check: passage.text FULL written out (not placeholder)? All 6 vocab used? JSON valid?`,
        output: { schema: ReadingFluencySchema },
      });
      return { ...(output as ReadingFluencyOutput), ageGroup: input.ageGroup };
    }

    // ── 🦁 9-10세 ────────────────────────────────────────────────────────
    const { output } = await ai.generate({
      config: { temperature: 0.72 },
      prompt: `You are an academic literacy teacher building content-area vocabulary and critical reading.
Output ONLY valid JSON. No preamble, no markdown.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[DEVELOPMENTAL THEORY]
${devCtx}

[PEDAGOGY]
${pedagogy}

Theory: ${spec.theory}
Curriculum: ${spec.curriculum.join(" · ")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[INPUT]
Topic: "${topic}"
Age: 9-10 years

[SCHEMA]
{
  "contentType": "academic_literacy",
  "title": string,
  "ageGroup": "9-10",
  "theme": string,
  "vocabulary": [            // 8 words: 4 general + 4 academic
    {
      "word": string,
      "emoji": string,
      "tier": 1|2|3,         // 1=everyday, 2=academic, 3=domain-specific
      "etymology": string,   // e.g. "Latin: vivere (to live)"
      "definition": string,
      "pos": string,
      "example_1": string,   // general context
      "example_2": string,   // academic context
      "word_family": [string],
      "collocations": [string]  // e.g. ["complex ecosystem"]
    }
  ],
  "passage": {
    "title": string,
    "genre": "informational"|"narrative"|"persuasive",
    "text_structure": "cause_effect"|"compare_contrast"|"problem_solution"|"chronological",
    "line_count": 14,
    "text": string,          // FULL 13-15 line passage. ALL 8 vocab words used naturally.
    "text_features": {
      "topic_sentence": string,
      "thesis_or_claim": string,
      "key_evidence": [string]  // 2-3 items
    }
  },
  "questions": [             // 3 questions
    {
      "type": "literal",
      "question": string,
      "answer": string
    },
    {
      "type": "inferential",
      "question": string,
      "evidence_prompt": string,
      "sample_answer": string
    },
    {
      "type": "critical",
      "question": string,
      "sentence_starters": ["I agree because...","I disagree because...","The evidence shows..."],
      "ai_feedback_rubric": {
        "3pts": "Clear opinion + 2 evidence + personal connection",
        "2pts": "Opinion + 1 evidence",
        "1pt": "Opinion only"
      }
    }
  ],
  "fill_in_blank": [string],  // 2 sentences with ___ for vocab
  "extension": {
    "type": "research_prompt",
    "prompt": string,
    "search_safe": true
  }
}

[RULES]
${spec.rules}

⚠️ Self-check: passage.text FULL written (not placeholder)? All 8 vocab used? Critical question has rubric? JSON valid?`,
      output: { schema: AcademicLiteracySchema },
    });
    return { ...(output as AcademicLiteracyOutput), ageGroup: input.ageGroup };
  }
);
