-- 가입 승인 시스템 마이그레이션
-- Supabase SQL Editor에서 실행하세요

-- 1. profiles 테이블에 status, email 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. 기존 유저는 모두 approved (이미 사용 중이던 계정)
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';

-- 3. 관리자 계정 approved 확인 (신규 실행 시)
UPDATE public.profiles
SET status = 'approved'
FROM auth.users
WHERE public.profiles.id = auth.users.id
  AND auth.users.email = 'kyd3534@gmail.com';
