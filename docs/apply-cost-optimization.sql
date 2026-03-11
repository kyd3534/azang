-- ============================================================
-- 비용 절감 시스템 적용 SQL
-- Supabase SQL Editor에서 순서대로 실행하세요
-- ============================================================

-- ── 1. profiles 테이블에 생성 한도 컬럼 추가 ──────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS generation_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_limit INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS generation_reset_at TIMESTAMPTZ
    DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month');

-- 관리자 계정: 한도 무제한 + 초기화 불필요
UPDATE profiles
SET generation_limit = 999999
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'kyd3534@gmail.com'
);

-- ── 2. AI 결과 캐시 테이블 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key   TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL,
  result      JSONB NOT NULL,
  used_count  INT DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_content_cache_key     ON content_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_content_cache_expires ON content_cache(expires_at);

-- content_cache RLS (서비스 롤만 접근)
ALTER TABLE content_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role only" ON content_cache;
CREATE POLICY "service role only" ON content_cache
  USING (true) WITH CHECK (true);

-- ── 3. 콘텐츠 테이블에 만료일 컬럼 추가 ─────────────────────
ALTER TABLE stories         ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE english_lessons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE hangul_lessons  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE number_lessons  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE coloring_pages  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 기존 콘텐츠는 영구 보존 (expires_at = NULL)
-- 새로 생성되는 일반 사용자 콘텐츠는 코드에서 30일 뒤로 설정

-- ── 4. RPC 함수: 캐시 사용 횟수 증가 ─────────────────────────
CREATE OR REPLACE FUNCTION increment_cache_used(key TEXT)
RETURNS void AS $$
  UPDATE content_cache SET used_count = used_count + 1 WHERE cache_key = key;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── 5. 만료 콘텐츠 자동 정리 함수 ────────────────────────────
-- Supabase Free 플랜: pg_cron 없으므로 수동 실행 or Edge Function 호출
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS TABLE(deleted_stories INT, deleted_lessons INT, deleted_hangul INT,
              deleted_numbers INT, deleted_coloring INT, deleted_cache INT) AS $$
DECLARE
  v_stories  INT;
  v_english  INT;
  v_hangul   INT;
  v_numbers  INT;
  v_coloring INT;
  v_cache    INT;
BEGIN
  DELETE FROM stories         WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_stories  = ROW_COUNT;

  DELETE FROM english_lessons WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_english  = ROW_COUNT;

  DELETE FROM hangul_lessons  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_hangul   = ROW_COUNT;

  DELETE FROM number_lessons  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_numbers  = ROW_COUNT;

  DELETE FROM coloring_pages  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  GET DIAGNOSTICS v_coloring = ROW_COUNT;

  DELETE FROM content_cache   WHERE expires_at < NOW();
  GET DIAGNOSTICS v_cache    = ROW_COUNT;

  RETURN QUERY SELECT v_stories, v_english, v_hangul, v_numbers, v_coloring, v_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. 정리 함수 테스트 실행 (이 줄 주석 해제해서 확인 가능) ─
-- SELECT * FROM cleanup_expired_content();

-- ── 7. 현재 상태 확인 쿼리 ────────────────────────────────────
-- 아래 SELECT를 실행해서 결과 확인

SELECT
  (SELECT COUNT(*) FROM profiles)                                  AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE generation_limit >= 999999) AS admin_users,
  (SELECT COUNT(*) FROM content_cache)                             AS cached_items,
  (SELECT COUNT(*) FROM stories WHERE expires_at IS NOT NULL)      AS stories_with_expiry,
  (SELECT pg_size_pretty(pg_database_size(current_database())))    AS db_size;
