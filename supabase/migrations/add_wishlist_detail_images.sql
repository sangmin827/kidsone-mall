-- ============================================================
-- 찜하기(wishlists) 테이블 생성 + 상세 이미지 타입 컬럼 추가
-- Supabase Dashboard > SQL Editor 에서 실행하세요
-- ============================================================

-- ── 찜하기 테이블 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INT  NOT NULL REFERENCES products(id)   ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlists"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlists"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlists"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- ── 상품 이미지 타입 컬럼 ──────────────────────────────────
-- 'gallery' : 기존 상단 이미지 갤러리 (기본값)
-- 'detail'  : 스마트스토어식 하단 상세 이미지
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS image_type TEXT NOT NULL DEFAULT 'gallery';
