-- 영상 보기 기능 마이그레이션
-- Supabase SQL Editor에서 실행하세요

-- app_settings 테이블 (NAS URL, 사용자명, 비밀번호 저장)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자 읽기
CREATE POLICY "authenticated_read_app_settings"
  ON app_settings FOR SELECT TO authenticated USING (true);

-- 인증된 사용자 쓰기 (앱 레이어에서 관리자만 사용)
CREATE POLICY "authenticated_write_app_settings"
  ON app_settings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 끝! videos 테이블은 불필요 — NAS 폴더를 자동 스캔합니다.
