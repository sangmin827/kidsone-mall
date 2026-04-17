# 오픈 직전 보강 — 적용 가이드

> 작성: 2026-04-17
> 대상 변경: 무통장 전용 + Footer + 약관/개인정보 + 14세 미만 차단 + 품절 관리 + 구매 희망 신청
> ⚠️ 내부용. 배포 후엔 docs/ 로 옮기거나 삭제하세요.

---

## 0. 변경 요약

| # | 영역 | 코드 상태 |
| --- | --- | --- |
| 1 | 무통장 전용 (PG 미연동 그대로 유지) | 추가 작업 없음 |
| 2 | Footer 사업자정보 placeholder | 코드 완료 — **이상민님 입력 필요** |
| 3 | 개인정보처리방침 / 이용약관 페이지 | 코드 완료 — **placeholder 채워야** |
| 4 | 14세 미만 가입 차단 + 약관 동의 (온보딩) | 코드 완료 |
| 5 | 품절 관리 + 구매 희망 신청 | 코드 완료 |
| DB | 마이그레이션 | **아직 실행 필요** |

---

## 1. DB 마이그레이션 (가장 먼저 실행)

Supabase Studio → SQL Editor 에서 **순서대로** 실행.

### 1-1. profiles 테이블에 온보딩 필드 추가

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS terms_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_agreed_at timestamptz;
```

### 1-2. products 테이블에 품절 관련 컬럼 추가

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_sold_out boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS hide_when_sold_out boolean DEFAULT false NOT NULL;

-- 목록 페이지 필터 성능용
CREATE INDEX IF NOT EXISTS idx_products_sold_out_visible
  ON products(is_sold_out, hide_when_sold_out);
```

### 1-3. 구매 희망 요청 테이블 신규 생성

```sql
CREATE TABLE IF NOT EXISTS purchase_requests (
  id           bigserial PRIMARY KEY,
  product_id   bigint NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text,            -- 스냅샷 (상품 삭제돼도 식별 가능하도록)
  customer_name  text NOT NULL,
  customer_phone text NOT NULL,
  privacy_agreed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'closed')),
  admin_memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 관리자 조회/필터용 인덱스
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status_created
  ON purchase_requests(status, created_at DESC);

-- RLS 정책
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- 누구나(비회원 포함) 신청 가능 (INSERT 만)
CREATE POLICY "Anyone can insert purchase requests"
  ON purchase_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 관리자만 조회 가능
CREATE POLICY "Only admins can read purchase requests"
  ON purchase_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 관리자만 수정 가능
CREATE POLICY "Only admins can update purchase requests"
  ON purchase_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
```

> 💡 RLS 정책의 admin 검사 부분은 기존 다른 테이블과 동일한 패턴이어야 합니다.
> 만약 다른 테이블이 다른 방식(예: 별도 admins 테이블, JWT claim)을 쓴다면 그 패턴에 맞춰 수정하세요.

### 1-4. (옵션) 기존 회원 처리

위 마이그레이션 직후, 기존 회원은 birthdate/terms_agreed_at/privacy_agreed_at 가 NULL 이므로 **다음 로그인 시 온보딩 페이지로 강제 이동**됩니다. 이게 의도된 동작 (재동의 받기). 만약 기존 회원을 그랜드파더 처리하고 싶다면:

```sql
-- 기존 회원에게 가짜 동의 시각만 채워넣어 온보딩 우회 (생년월일은 여전히 비어있어서 14세 차단 못함 — 비추천)
-- UPDATE profiles
--   SET terms_agreed_at = now(), privacy_agreed_at = now()
--   WHERE terms_agreed_at IS NULL;
```

권장: 기존 회원도 한번은 온보딩 거치게 두는 것 (법적 동의 명확화).

---

## 2. 사업자정보 / 정책 문구 입력

### 2-1. Footer 사업자정보

`src/components/layout/Footer.tsx` 안에 `[상호명 입력]`, `[대표자명 입력]`, `[전화번호 입력]` 등 placeholder 가 회색 글씨로 표시되어 있습니다. 통신판매업 신고 완료 후 그 자리에 실제 값으로 치환하세요.

찾아야 할 placeholder:
- 상호명, 대표자명, 사업자등록번호, 통신판매업 신고번호, 사업장 주소
- 고객센터 전화번호, 이메일, 운영시간

### 2-2. 개인정보처리방침 / 이용약관

각 페이지 상단 주석에 ⚠️ 로 표시한 항목들 채워주세요. 핵심:

`src/app/privacy/page.tsx`
- `[YYYY-MM-DD]` 시행일자
- `[회사명]`, `[성명 입력]`, `[전화번호 입력]`, `[이메일 입력]` (개인정보 보호책임자 섹션)

`src/app/terms/page.tsx`
- `[YYYY-MM-DD]` 시행일자
- `[회사명]`

> 💡 표준 템플릿 기반이라 그대로 사용해도 큰 문제는 없지만, 가능하면 변호사 검토 후 시행을 권장합니다.

---

## 3. 신규 라우트 / 컴포넌트 목록

### 사용자 영역
- `src/app/privacy/page.tsx` — 개인정보처리방침
- `src/app/terms/page.tsx` — 이용약관
- `src/app/onboarding/page.tsx` — 첫 로그인 시 생년월일·동의 입력
- `src/app/onboarding/blocked/page.tsx` — 14세 미만 안내
- `src/app/onboarding/actions.ts` — 온보딩 server action
- `src/components/layout/Footer.tsx` — 푸터
- `src/components/product/SoldOutBox.tsx` — 품절 시 구매 희망 버튼/모달

### 관리자 영역
- `src/app/admin/purchase-requests/page.tsx` — 구매 희망 요청 조회/처리

### 서버
- `src/server/purchase-requests.ts` — 구매 희망 신청 + 조회 + 상태 변경
- `src/server/profile.ts` — `needsOnboarding()` 헬퍼 추가

### 수정된 파일
- `src/app/layout.tsx` — Footer import + 본문 아래 삽입
- `src/app/auth/callback/route.ts` — 콜백 직후 온보딩 필요 여부 분기
- `src/app/products/page.tsx` — 품절 + 숨김 옵션 반영, 카드에 품절 오버레이
- `src/app/products/[slug]/page.tsx` — 품절이면 SoldOutBox, 아니면 기존 ProductPurchaseBox
- `src/app/admin/page.tsx` — 대시보드에 "구매 희망 요청" 카드 추가
- `src/components/admin/products/ProductForm.tsx` — 품절·숨김 체크박스 섹션
- `src/components/admin/products/ProductTable.tsx` — 품절 배지
- `src/server/admin-products.ts` — `is_sold_out`/`hide_when_sold_out` 처리

---

## 4. 동작 검증 체크리스트

### 4-1. 온보딩 / 14세 차단
- [ ] 새 계정으로 소셜 로그인 → 자동으로 `/onboarding` 이동
- [ ] 생년월일을 만 14세 미만으로 입력 → `/onboarding/blocked` + 자동 로그아웃
- [ ] 만 14세 이상으로 입력 + 두 동의 체크 → `/` (또는 `next` 파라미터) 이동
- [ ] 이미 온보딩 완료한 계정 재로그인 → 온보딩 안 거치고 바로 next 로

### 4-2. Footer / 정책 페이지
- [ ] 모든 페이지 하단에 푸터 노출 (헤더 아래 + body 끝)
- [ ] 푸터 "이용약관" 링크 → `/terms`
- [ ] 푸터 "개인정보처리방침" 링크 → `/privacy`
- [ ] 두 페이지에서 ← 홈으로 / → 다른 정책 링크 동작

### 4-3. 품절 관리
- [ ] 관리자 상품 수정 → "품절 처리" 체크 + 저장
- [ ] 상품 상세 페이지 → SoldOutBox 노출 (구매 희망 버튼)
- [ ] "구매 희망" 클릭 → 모달 노출
- [ ] 동의 체크 안 하고 신청 → 토스트 에러
- [ ] 정상 신청 → 성공 토스트 + 모달 닫힘
- [ ] "품절 시 목록에서도 숨기기" 체크 → /products 목록에서 사라짐
- [ ] 위 두 옵션 다 켠 상품의 상세 페이지 직접 URL 접근 → 404

### 4-4. 구매 희망 요청 관리
- [ ] `/admin/purchase-requests` 진입 가능
- [ ] 신청한 건이 목록에 표시됨 (상품명/이름/연락처)
- [ ] 상태 토글(대기 → 안내 완료) + 메모 저장 → 저장 후 화면에 반영
- [ ] 상태 필터 동작 확인
- [ ] 활동 로그(`/admin/activity-logs`)에 status_change 로 기록되는지

### 4-5. 회귀
- [ ] 기존 비회원 주문 흐름 정상 동작 (회원가입 변경 영향 없음 확인)
- [ ] 기존 결제(무통장) 정상 동작
- [ ] 기존 카테고리 / 신상품 / Top10 노출 정상

---

## 5. 적용 순서 (배포 직전)

```
① DB 마이그레이션 (1-1, 1-2, 1-3 순서)
   ↓
② Footer / Privacy / Terms placeholder 실제 값으로 치환
   ↓
③ main 푸시 → Vercel 자동 배포
   ↓
④ 위 검증 체크리스트 4-1 ~ 4-5 차례로 확인
```

---

## 6. 알아두면 좋은 점

**왜 RLS 정책의 admin 검사를 EXISTS 로 했는지**

JWT claim 으로 role 검사하는 게 더 빠르지만, 기존 코드에서 role 을 profiles 테이블로 관리하고 있어서 통일감을 위해 같은 패턴 사용. 만약 트래픽이 커져서 성능이 문제가 되면 그때 JWT claim 으로 옮기는 걸 고려.

**왜 기존 stock 컬럼을 안 지웠는지**

선택하신 옵션이 "stock 유지 + is_sold_out 추가"였고, 이 결정이 맞아요. 이유:
1. order_items 같은 곳에서 stock 참조하고 있을 가능성
2. 나중에 자동 재고 관리(예: 매출 분석)로 돌아가고 싶을 때 데이터 보존
3. 마이그레이션 위험 최소화

지금은 사용자 측 코드(/products, /products/[slug], 장바구니/주문)가 stock 을 무시하고 is_sold_out 만 보면 됩니다. 관리자 폼에서는 stock 입력이 여전히 남아있는데, **재고 자동 차감을 안 하므로 입력값을 굳이 신경쓰지 않아도 됩니다** (참고용 메모로 활용 가능).

**구매 희망 신청에서 비회원도 신청 가능한 이유**

품절 알림은 회원가입의 진입장벽 없이 받을 수 있어야 전환이 됩니다. 비회원도 INSERT 가능하도록 RLS 를 열어두었고, 동의 체크박스로 법적 동의를 받습니다.

**알림(SMS/카톡) 자동 발송은 일부러 빼두었음**

지금은 "관리자가 보고 직접 연락" 흐름. 나중에 카카오 비즈메시지 / Solapi 같은 SMS API 를 붙이면, `updatePurchaseRequest` 안에서 status가 'contacted' 로 바뀔 때 자동 발송하도록 확장 가능합니다.
