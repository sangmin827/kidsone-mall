import type { AdminCategory } from '@/src/server/admin-categories';
import type { AdminProduct } from '@/src/server/admin-products';
import ProductImageManager from '@/src/components/admin/products/ProductImageManager';
import AdminFormShell from '@/src/components/admin/common/AdminFormShell';
import SubmitButton from '@/src/components/admin/common/SubmitButton';

type Props = {
  defaultValue?: AdminProduct | null;
  categories: AdminCategory[];
  action: (formData: FormData) => Promise<void>;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        ) : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-800">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-gray-500">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black';

export default function ProductForm({
  defaultValue,
  categories,
  action,
}: Props) {
  const isEdit = !!defaultValue;

  // 상위 / 하위 카테고리 옵션으로 변환 (level 기반 들여쓰기)
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id - b.id;
  });

  return (
    <AdminFormShell
      action={action}
      successMessage={isEdit ? '상품 정보가 수정되었습니다.' : '상품이 등록되었습니다.'}
      redirectOnSuccess={isEdit ? undefined : '/admin/products'}
      className="space-y-6"
    >
      {isEdit ? (
        <input type="hidden" name="id" value={defaultValue!.id} />
      ) : null}

      {/* 1. 기본 정보 */}
      <Section
        title="기본 정보"
        description="상품명·슬러그·카테고리 등 핵심 식별 정보를 입력합니다."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="상품명" required>
            <input
              type="text"
              name="name"
              defaultValue={defaultValue?.name ?? ''}
              className={inputBase}
              placeholder="예: 한국기어 공룡 장난감"
              required
            />
          </Field>

          <Field
            label="슬러그 (URL)"
            required
            hint="URL 주소에 사용됩니다. 영문 소문자·숫자·하이픈(-)만 권장."
          >
            <input
              type="text"
              name="slug"
              defaultValue={defaultValue?.slug ?? ''}
              className={inputBase}
              placeholder="예: korea-gear-dino"
              required
            />
          </Field>

          <Field
            label="카테고리"
            required
            hint="상품은 반드시 하나의 카테고리에 속해야 합니다."
          >
            <select
              name="category_id"
              defaultValue={
                defaultValue?.category_id !== undefined &&
                defaultValue?.category_id !== null
                  ? String(defaultValue.category_id)
                  : ''
              }
              className={inputBase}
              required
            >
              <option value="" disabled>
                카테고리를 선택해 주세요
              </option>
              {sortedCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.level > 1 ? '└ ' : ''}
                  {cat.name}
                  {cat.is_active ? '' : ' (비활성)'}
                </option>
              ))}
            </select>
            {sortedCategories.length === 0 ? (
              <span className="mt-1 block text-xs text-rose-600">
                먼저 &quot;관리자 &gt; 카테고리&quot; 에서 카테고리를 하나 이상 등록해 주세요.
              </span>
            ) : null}
          </Field>
        </div>
      </Section>

      {/* 2. 상세 설명 */}
      <Section
        title="상세 설명"
        description="상품 목록에 노출되는 짧은 설명과, 상세 페이지 전체 설명을 입력합니다."
      >
        <Field
          label="짧은 설명"
          hint="상품 목록 카드나 검색 결과에 노출되는 1~2줄 설명."
        >
          <input
            type="text"
            name="short_description"
            defaultValue={defaultValue?.short_description ?? ''}
            className={inputBase}
            placeholder="예: 아이가 들 수 있는 부드러운 촉감의 공룡 모형"
            maxLength={200}
          />
        </Field>

        <Field label="상세 설명" hint="상품 상세 페이지에 표시되는 전체 설명입니다.">
          <textarea
            name="description"
            defaultValue={defaultValue?.description ?? ''}
            className={`${inputBase} min-h-[160px] resize-y`}
            placeholder={'상품의 특징, 소재, 크기, 사용법 등을 입력하세요.\n줄바꿈 그대로 표시됩니다.'}
          />
        </Field>
      </Section>

      {/* 3. 가격·재고 */}
      <Section title="가격 · 재고" description="판매 가격과 재고 수량을 입력합니다.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="판매 가격 (원)" required>
            <input
              type="number"
              name="price"
              defaultValue={defaultValue?.price ?? 0}
              className={inputBase}
              min={0}
              required
            />
          </Field>

          <Field
            label="재고 수량"
            required
            hint="참고용 수치입니다. 품절 여부는 아래 '품절 설정' 에서 수동으로 관리합니다."
          >
            <input
              type="number"
              name="stock"
              defaultValue={defaultValue?.stock ?? 0}
              className={inputBase}
              min={0}
              required
            />
          </Field>
        </div>
      </Section>

      {/* 4. 이미지 — 수정 모드에서만 */}
      <Section
        title="상품 이미지"
        description="대표 이미지를 지정하면 상품 목록·상세 페이지의 첫 화면에 사용됩니다."
      >
        {isEdit ? (
          <ProductImageManager
            productId={defaultValue!.id}
            images={defaultValue!.images ?? []}
          />
        ) : (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            이미지는 상품 등록을 먼저 저장한 뒤, 상세 편집 화면에서 추가할 수 있습니다.
          </p>
        )}
      </Section>

      {/* 5. 노출·배지 */}
      <Section
        title="노출 · 배지"
        description="쇼핑몰에서의 노출 여부, 신상품/Top 10 표시를 설정합니다."
      >
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={defaultValue ? defaultValue.is_active : true}
              className="mt-0.5"
            />
            <span>
              <strong className="font-medium">판매중으로 표시</strong>
              <span className="block text-xs text-gray-500">
                체크 해제 시 쇼핑몰에서 상품이 숨겨집니다.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_new"
              defaultChecked={defaultValue?.is_new ?? false}
              className="mt-0.5"
            />
            <span>
              <strong className="font-medium">신상품으로 표시</strong>
              <span className="block text-xs text-gray-500">
                메인의 &lsquo;신상품&rsquo; 메뉴에 노출됩니다.
              </span>
            </span>
          </label>

          <Field
            label="Top 순위 (1~100)"
            hint="1~10위는 홈화면에도 노출되고, 11~100위는 Top 10 페이지에만 노출됩니다. 같은 순위에 다른 상품이 있으면 저장 시 그 상품의 순위는 자동으로 비워집니다. 여러 상품을 한꺼번에 지정할 때는 'Top 10 · 100 관리' 페이지를 사용하세요."
          >
            <input
              type="number"
              name="top10_rank"
              min={1}
              max={100}
              defaultValue={
                defaultValue?.top10_rank !== undefined &&
                defaultValue?.top10_rank !== null
                  ? String(defaultValue.top10_rank)
                  : ''
              }
              placeholder="비워두면 순위 없음"
              className={`${inputBase} md:w-60`}
            />
          </Field>
        </div>
      </Section>

      {/* 6. 품절 설정 */}
      <Section
        title="품절 설정"
        description="품절 여부를 수동으로 관리합니다. 체크 시 '구매 희망' 버튼이 표시됩니다."
      >
        <div className="space-y-3 rounded-xl bg-rose-50 p-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_sold_out"
              defaultChecked={defaultValue?.is_sold_out ?? false}
              className="mt-0.5"
            />
            <span>
              <strong className="font-medium">품절 처리</strong>
              <span className="block text-xs text-gray-500">
                상세 페이지에서 장바구니/바로구매 대신 &lsquo;구매 희망&rsquo; 버튼이 노출됩니다.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="hide_when_sold_out"
              defaultChecked={defaultValue?.hide_when_sold_out ?? false}
              className="mt-0.5"
            />
            <span>
              <strong className="font-medium">품절 시 목록에서도 숨기기</strong>
              <span className="block text-xs text-gray-500">
                체크 시 품절 상태에서는 상품 목록에 아예 표시되지 않습니다.
              </span>
            </span>
          </label>

          <p className="text-xs text-rose-700">
            구매 희망 신청 내역은 &quot;관리자 &gt; 구매 희망 요청&quot; 메뉴에서 확인할 수 있습니다.
          </p>
        </div>
      </Section>

      {/* 제출 버튼 */}
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-2 border-t border-gray-200 bg-white/90 px-1 py-3 backdrop-blur">
        <SubmitButton
          label={isEdit ? '상품 수정 저장' : '상품 등록'}
          pendingLabel={isEdit ? '저장 중...' : '등록 중...'}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
        />
      </div>
    </AdminFormShell>
  );
}
