-- ============================================================
-- 취소/반품 요청에 관리자 메모 + 고객 안내문구 컬럼 추가
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

ALTER TABLE cancel_requests
  ADD COLUMN IF NOT EXISTS admin_memo       TEXT,
  ADD COLUMN IF NOT EXISTS customer_notice  TEXT;

ALTER TABLE return_requests
  ADD COLUMN IF NOT EXISTS admin_memo       TEXT,
  ADD COLUMN IF NOT EXISTS customer_notice  TEXT;
