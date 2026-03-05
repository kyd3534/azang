-- ElevenLabs TTS 전환 마이그레이션
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS elevenlabs_api_key TEXT,
  ADD COLUMN IF NOT EXISTS voice_profiles JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS active_voice_id TEXT;
