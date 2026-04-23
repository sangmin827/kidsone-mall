-- ============================================================
-- orders 테이블에 택배사 코드 + 송장번호 컬럼 추가
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS courier_code    TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT;
