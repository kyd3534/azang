-- ============================================================
-- 아장아장 음성 프로필 마이그레이션
-- Supabase SQL Editor에서 실행하세요 (재실행 안전)
-- ============================================================

-- 1. profiles 테이블에 voice_sample_url 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS voice_sample_url TEXT;

-- 2. voice-samples Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-samples', 'voice-samples', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. 기존 Storage 정책 제거 후 재생성 (재실행 안전)
DROP POLICY IF EXISTS "Users can upload their own voice sample" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own voice sample" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice sample" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read voice samples (public bucket)" ON storage.objects;

CREATE POLICY "Users can upload their own voice sample"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-samples'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own voice sample"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'voice-samples'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'voice-samples'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own voice sample"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voice-samples'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can read voice samples (public bucket)"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-samples');
