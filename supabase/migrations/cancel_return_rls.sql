-- ============================================================
-- 취소/반품 기능 확장을 위한 Supabase RLS 정책
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

-- 1. cancel_requests 테이블 RLS 활성화 및 정책 추가
ALTER TABLE cancel_requests ENABLE ROW LEVEL SECURITY;

-- 유저: 자신의 주문에 대한 취소요청 조회
CREATE POLICY "Users can view own cancel requests"
ON cancel_requests FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = cancel_requests.order_id
    AND orders.user_id = auth.uid()
  )
);

-- 유저/게스트: 취소요청 등록
CREATE POLICY "Users can insert own cancel requests"
ON cancel_requests FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 관리자: 모든 취소요청 조회
CREATE POLICY "Admins can view all cancel requests"
ON cancel_requests FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 관리자: 취소요청 상태 업데이트
CREATE POLICY "Admins can update all cancel requests"
ON cancel_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 2. return_requests 테이블 RLS 활성화 및 정책 추가
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

-- 유저: 자신의 주문에 대한 반품요청 조회
CREATE POLICY "Users can view own return requests"
ON return_requests FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = return_requests.order_id
    AND orders.user_id = auth.uid()
  )
);

-- 유저: 반품요청 등록
CREATE POLICY "Users can insert own return requests"
ON return_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- 관리자: 모든 반품요청 조회
CREATE POLICY "Admins can view all return requests"
ON return_requests FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 관리자: 반품요청 상태 업데이트
CREATE POLICY "Admins can update all return requests"
ON return_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 3. return_requests.status 가 ENUM이면 아래 실행 (TEXT/VARCHAR이면 불필요)
-- ALTER TYPE return_request_status ADD VALUE IF NOT EXISTS 'picked_up';

-- 4. cancel_request_items RLS
ALTER TABLE cancel_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert cancel request items"
ON cancel_request_items FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Users can view own cancel request items"
ON cancel_request_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cancel_requests cr
    JOIN orders o ON o.id = cr.order_id
    WHERE cr.id = cancel_request_items.cancel_request_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all cancel request items"
ON cancel_request_items FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 5. return_request_items RLS
ALTER TABLE return_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert return request items"
ON return_request_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view own return request items"
ON return_request_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM return_requests rr
    JOIN orders o ON o.id = rr.order_id
    WHERE rr.id = return_request_items.return_request_id
    AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all return request items"
ON return_request_items FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
