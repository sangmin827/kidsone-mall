# 관리자 기능 개선 — 적용 가이드

> 작성: 2026-04-17
> 대상 변경: Top 10/신상품 플래그 + Admin Basic Auth + Activity Logs UI
> ⚠️ 이 문서는 내부용입니다. 배포 후에는 docs/ 로 이동하거나 삭제하세요.

---

## 0. 변경 요약

| 구분 | 범위 | 상태 |
| --- | --- | --- |
| Task 1 | `products.is_new`, `products.top10_rank` 컬럼 추가 + 관리자 UI + /products 정렬 로직 | 코드 완료 |
| Task 2-1 | `src/middleware.ts` — `/admin/*` Basic Auth 게이트 | 코드 완료 |
| Task 2-3 | `/admin/activity-logs` 조회 페이지 | 코드 완료 |
| Task 2-4 | `/admin` 대시보드에 활동 로그 카드 추가 | 코드 완료 |
| DB 마이그레이션 | `ALTER TABLE products ...` | **아직 실행 필요** |
| 환경변수 | `ADMIN_BASIC_AUTH_USER/PASS` | **아직 설정 필요** |

---

## 1. DB 마이그레이션 (필수, 가장 먼저)

Supabase Studio → SQL Editor 에서 **순서대로** 실행.

### 1-1. products 테이블에 is_new / top10_rank 추가

```sql
-- products: 신상품 플래그 + Top 10 순위
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS top10_rank smallint
    CHECK (top10_rank IS NULL OR (top10_rank BETWEEN 1 AND 10));

-- 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_products_top10_rank
  ON products(top10_rank) WHERE top10_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_is_new
  ON products(is_new) WHERE is_new = true;
```

### 1-2. (옵션) 보안 검토 — 기존 RLS 정책

현재 products 테이블에 `Allow product stock updates for ordering` 정책이 걸려있어서
**누구나(anon 포함) UPDATE 가능**합니다. 주문 시 재고 차감 때문에 열어둔 것이지만,
이상적으로는 `stock` 컬럼만 업데이트 가능하도록 좁혀야 합니다.

```sql
-- 확인용: 현재 정책 조회
SELECT polname, polcmd, polroles, pg_get_expr(polqual, polrelid) as qual
FROM pg_policy
WHERE polrelid = 'products'::regclass;
```

**바로 수정하지 말고**, 주문 로직이 Supabase client 에서 직접 UPDATE 하는지
아니면 RPC/Server Action 으로 감싸져 있는지 먼저 확인한 뒤 결정하세요.
(이번 릴리즈 범위 밖 — 별도 이슈로 추적 권장)

---

## 2. 환경변수 설정

### 2-1. 로컬 개발 (`.env.local`)

```bash
# 로컬에서는 비워두면 middleware 가 바이패스(= 인증 없음) → 개발 편의
# 만약 로컬에서도 게이트를 테스트하고 싶으면 아래 두 줄 주석 해제:
# ADMIN_BASIC_AUTH_USER=admin
# ADMIN_BASIC_AUTH_PASS=localdev-pass
```

### 2-2. Vercel 프로덕션 (반드시 설정)

Vercel 대시보드 → Project → Settings → Environment Variables 에 추가:

| Name | Value | Environments |
| --- | --- | --- |
| `ADMIN_BASIC_AUTH_USER` | (강력한 아이디, 예: `kidsone-admin`) | Production, Preview |
| `ADMIN_BASIC_AUTH_PASS` | (충분히 긴 랜덤 문자열 — 최소 20자, 특수문자 포함) | Production, Preview |

**주의사항**
- 프로덕션에 env 가 없으면 게이트가 열립니다 (middleware 의 dev-bypass 분기). 반드시 설정!
- 자격증명은 팀원에게 1Password/Bitwarden 같은 안전한 채널로만 공유.
- 탈취가 의심되면 env 값을 변경 → Vercel 이 자동 재배포 → 즉시 무효화.
- Basic Auth 는 **HTTPS 상에서만** 안전 (Vercel 기본 HTTPS 라 OK).

### 2-3. 비밀번호 생성 예시 (macOS/Linux)

```bash
# 32자 랜덤 비밀번호
openssl rand -base64 24
```

---

## 3. 배포 순서

```
① DB 마이그레이션 실행 (Supabase)
   ↓
② Vercel 환경변수 설정 저장
   ↓
③ main 브랜치에 푸시 / Vercel 이 자동 배포
   ↓
④ 배포 완료 후 /admin 접근 테스트
```

**순서가 중요한 이유**
- DB 마이그레이션을 먼저 하지 않고 배포하면
  `is_new` / `top10_rank` 컬럼이 없어서 관리자 페이지 로드시 500 에러.
- 환경변수 설정을 안 하고 배포하면 **게이트가 열린 채로 프로덕션에 나감**.

---

## 4. 배포 후 검증 체크리스트

### 4-1. Basic Auth 게이트
- [ ] 시크릿 창에서 `https://<도메인>/admin` 접근 → 브라우저 로그인 프롬프트 뜨는지
- [ ] 잘못된 자격증명 입력 → 401 재프롬프트
- [ ] 올바른 자격증명 입력 → `/admin` 대시보드 표시
- [ ] 비관리자 계정으로 로그인한 상태에서 Basic Auth 통과 후 → `requireAdmin()` 으로 차단되는지

### 4-2. 상품 관리 — Top 10 / 신상품
- [ ] `/admin/products/<id>` 진입 → "노출 설정" 박스에 is_new 체크박스 + top10_rank 셀렉트 보이는지
- [ ] 상품 A 에 top10_rank=1 저장 → `/products?view=top10` 에서 노출
- [ ] 상품 B 에 top10_rank=1 저장 → 상품 A 의 rank 가 자동으로 null 로 바뀌는지 (중복 방지)
- [ ] `/products?sort=new` 에서 is_new 상품이 상단에 노출되는지
- [ ] 상품 카드에 `TOP N` / `신상품` 배지 렌더링 확인

### 4-3. 활동 로그
- [ ] `/admin/activity-logs` 접근 가능
- [ ] 상품 수정 시 로그에 `update` + before/after JSON 이 쌓이는지
- [ ] 엔티티/액션 필터 동작 확인
- [ ] 페이지네이션 (50건 단위) 동작 확인
- [ ] 관리자 이름/이메일이 profiles 에서 조인되어 표시되는지

### 4-4. 롤백 계획
문제 발생 시:
1. **배지 관련 오류만** → `ALTER TABLE products DROP COLUMN is_new, DROP COLUMN top10_rank;` 는 하지 말 것 (데이터 소실). 대신 Vercel 에서 이전 배포로 rollback.
2. **Basic Auth 접근 불가** → env 값 재확인, 필요시 env 두 개 모두 삭제하면 게이트 비활성 (임시).
3. **activity-logs 페이지 에러** → 기존 `admin_activity_logs` 테이블 존재 여부 확인 (`SELECT count(*) FROM admin_activity_logs;`).

---

## 5. 관련 파일 목록 (코드 리뷰용)

```
src/middleware.ts                                  (신규)
src/app/admin/page.tsx                             (카드 추가)
src/app/admin/activity-logs/page.tsx               (신규)
src/server/admin-activity-logs.ts                  (getAdminActivityLogs 추가)
src/server/admin-products.ts                       (is_new/top10_rank + 로깅 훅)
src/components/admin/products/ProductForm.tsx     (노출 설정 섹션)
src/components/admin/products/ProductTable.tsx    (배지 컬럼)
src/app/products/page.tsx                          (top10/is_new 정렬 로직)
src/components/products/ProductsToolbar.tsx       (검색/정렬 툴바)
src/components/CategoryMenu.tsx                    (드롭다운 구조)
src/components/MobileMenu.tsx                      (모바일 메뉴)
```
