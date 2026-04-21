-- ============================================================
-- 취소/반품 철회 상태 추가
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

-- cancel_requests: CHECK 제약 교체
ALTER TABLE cancel_requests
  DROP CONSTRAINT IF EXISTS cancel_requests_status_check;

ALTER TABLE cancel_requests
  ADD CONSTRAINT cancel_requests_status_check
  CHECK (status IN (
    'requested',
    'completed',
    'rejected',
    'withdraw_requested',
    'withdraw_completed'
  ));

-- return_requests: CHECK 제약 교체
ALTER TABLE return_requests
  DROP CONSTRAINT IF EXISTS return_requests_status_check;

ALTER TABLE return_requests
  ADD CONSTRAINT return_requests_status_check
  CHECK (status IN (
    'requested',
    'picked_up',
    'completed',
    'rejected',
    'withdraw_requested',
    'withdraw_completed'
  ));
