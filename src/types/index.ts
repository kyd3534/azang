// DB 테이블 타입

export interface Story {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export interface EnglishLesson {
  id: string;
  user_id: string;
  title: string;
  words: { word: string; meaning: string; audio_url?: string }[];
  created_at: string;
}

export interface HangulLesson {
  id: string;
  user_id: string;
  title: string;
  characters: { char: string; pronunciation: string }[];
  created_at: string;
}

export interface NumberLesson {
  id: string;
  user_id: string;
  title: string;
  numbers: { value: number; korean: string }[];
  created_at: string;
}

export interface ColoringPage {
  id: string;
  user_id: string;
  title: string;
  svg_content: string;
  created_at: string;
}

export interface ColoringStroke {
  id: string;
  page_id: string;
  strokes: object;
  updated_at: string;
}
