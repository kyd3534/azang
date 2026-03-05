-- 비용 절감 시스템: 캐싱 + 생성 한도 + 콘텐츠 만료

-- 1. profiles에 생성 한도 컬럼 추가
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS generation_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_limit INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS generation_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month');

-- 관리자 무제한
UPDATE profiles SET generation_limit = 999999 WHERE email = 'kyd3534@gmail.com';

-- 2. AI 결과 캐시 테이블
CREATE TABLE IF NOT EXISTS content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL,  -- 'story'|'english'|'hangul'|'numbers'|'coloring'
  result JSONB NOT NULL,
  used_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);
CREATE INDEX IF NOT EXISTS idx_content_cache_key ON content_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_content_cache_expires ON content_cache(expires_at);

-- 3. 콘텐츠 테이블에 만료일 컬럼 추가
ALTER TABLE stories ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE english_lessons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE hangul_lessons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE number_lessons ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE coloring_pages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

-- 기존 콘텐츠는 만료 없음 (NULL = 영구)
UPDATE stories SET expires_at = NULL WHERE created_at < NOW() - INTERVAL '1 day';
UPDATE english_lessons SET expires_at = NULL WHERE created_at < NOW() - INTERVAL '1 day';
UPDATE hangul_lessons SET expires_at = NULL WHERE created_at < NOW() - INTERVAL '1 day';
UPDATE number_lessons SET expires_at = NULL WHERE created_at < NOW() - INTERVAL '1 day';
UPDATE coloring_pages SET expires_at = NULL WHERE created_at < NOW() - INTERVAL '1 day';

-- 4. RLS
ALTER TABLE content_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON content_cache USING (true) WITH CHECK (true);

-- 5. used_count 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_cache_used(key TEXT)
RETURNS void AS $$
  UPDATE content_cache SET used_count = used_count + 1 WHERE cache_key = key;
$$ LANGUAGE sql SECURITY DEFINER;
