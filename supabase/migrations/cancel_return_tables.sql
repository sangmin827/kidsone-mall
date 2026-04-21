-- ============================================================
-- 취소/반품 테이블 생성 + RLS 정책
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

-- ① cancel_requests 테이블
CREATE TABLE IF NOT EXISTS cancel_requests (
  id                   BIGSERIAL PRIMARY KEY,
  order_id             BIGINT       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id              UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  type                 TEXT         NOT NULL CHECK (type IN ('full', 'partial')),
  status               TEXT         NOT NULL DEFAULT 'requested'
                                    CHECK (status IN ('requested', 'completed', 'rejected')),
  reason               TEXT,
  refund_bank          TEXT,
  refund_account_number TEXT,
  refund_account_name  TEXT,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ② cancel_request_items 테이블 (부분 취소용)
CREATE TABLE IF NOT EXISTS cancel_request_items (
  id                  BIGSERIAL PRIMARY KEY,
  cancel_request_id   BIGINT NOT NULL REFERENCES cancel_requests(id) ON DELETE CASCADE,
  order_item_id       BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  quantity            INT    NOT NULL CHECK (quantity > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ③ return_requests 테이블
CREATE TABLE IF NOT EXISTS return_requests (
  id         BIGSERIAL PRIMARY KEY,
  order_id   BIGINT      NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  type       TEXT        NOT NULL CHECK (type IN ('full', 'partial')),
  status     TEXT        NOT NULL DEFAULT 'requested'
                         CHECK (status IN ('requested', 'picked_up', 'completed', 'rejected')),
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ④ return_request_items 테이블 (부분 반품용)
CREATE TABLE IF NOT EXISTS return_request_items (
  id                 BIGSERIAL PRIMARY KEY,
  return_request_id  BIGINT NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id      BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  quantity           INT    NOT NULL CHECK (quantity > 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS 활성화 및 정책 설정
-- ============================================================

-- cancel_requests RLS
ALTER TABLE cancel_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cancel_requests_user_select"
ON cancel_requests FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = cancel_requests.order_id
      AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "cancel_requests_insert"
ON cancel_requests FOR INSERT TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "cancel_requests_admin_select"
ON cancel_requests FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "cancel_requests_admin_update"
ON cancel_requests FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- cancel_request_items RLS
ALTER TABLE cancel_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cancel_request_items_insert"
ON cancel_request_items FOR INSERT TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "cancel_request_items_user_select"
ON cancel_request_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cancel_requests cr
    JOIN orders o ON o.id = cr.order_id
    WHERE cr.id = cancel_request_items.cancel_request_id
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY "cancel_request_items_admin_all"
ON cancel_request_items FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- return_requests RLS
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "return_requests_user_select"
ON return_requests FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = return_requests.order_id
      AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "return_requests_insert"
ON return_requests FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "return_requests_admin_select"
ON return_requests FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "return_requests_admin_update"
ON return_requests FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- return_request_items RLS
ALTER TABLE return_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "return_request_items_insert"
ON return_request_items FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "return_request_items_user_select"
ON return_request_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM return_requests rr
    JOIN orders o ON o.id = rr.order_id
    WHERE rr.id = return_request_items.return_request_id
      AND o.user_id = auth.uid()
  )
);

CREATE POLICY "return_request_items_admin_all"
ON return_request_items FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
