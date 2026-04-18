'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AdminProduct } from '@/src/server/admin-products';
import type { AdminCategory } from '@/src/server/admin-categories';
import { updateProduct } from '@/src/server/admin-product-actions';

type Props = {
  product: AdminProduct;
  allCategories: AdminCategory[];
  onClose: () => void;
};

/**
 * 카탈로그 트리에서 '상세' 버튼으로 여는 모달.
 *
 * 한 화면에서 많이 쓰는 필드를 모아 수정합니다:
 *   - 이름 / 슬러그 / 가격 / 재고 / 짧은 설명
 *   - 카테고리
 *   - 노출 / 신상품 / 품절 / 품절 숨김 / Top 순위
 *
 * 긴 설명 (description) 과 이미지 관리는 전체 편집 페이지로 이동해 주세요.
 */
export default function ProductDetailModal({
  product,
  allCategories,
  onClose,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { parents, childrenByParent } = useMemo(() => {
    const ps: AdminCategory[] = [];
    const byParent = new Map<number, AdminCategory[]>();
    for (const c of allCategories) {
      if (c.level === 1 || c.parent_id === null) {
        ps.push(c);
      } else {
        const list = byParent.get(c.parent_id) ?? [];
        list.push(c);
        byParent.set(c.parent_id, list);
      }
    }
    return { parents: ps, childrenByParent: byParent };
  }, [allCategories]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('id', String(product.id));
      // updateProduct 는 description 도 기대하므로 기존 값 유지
      fd.set('description', product.description ?? '');
      await updateProduct(fd);
      toast.success('상품이 수정되었습니다.');
      onClose();
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '저장 실패';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    'w-full rounded-xl border px-3 py-2 text-sm focus:border-gray-500 focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              &lsquo;{product.name}&rsquo; 상세 수정
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              긴 설명과 이미지 관리는{' '}
              <Link
                href={`/admin/products/${product.id}`}
                className="underline hover:text-black"
              >
                전체 편집 페이지
              </Link>
              에서 수정하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                상품명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                defaultValue={product.name}
                required
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                슬러그 (URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="slug"
                defaultValue={product.slug}
                required
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                가격 (원) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                min={0}
                step={100}
                defaultValue={product.price}
                required
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">재고</label>
              <input
                type="number"
                name="stock"
                min={0}
                defaultValue={product.stock}
                className={inputBase}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                카테고리 <span className="text-rose-500">*</span>
              </label>
              <select
                name="category_id"
                defaultValue={
                  product.category_id !== null
                    ? String(product.category_id)
                    : ''
                }
                required
                className={inputBase}
              >
                <option value="" disabled>
                  카테고리 선택
                </option>
                {parents.map((parent) => {
                  const childs = childrenByParent.get(parent.id) ?? [];
                  return (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name} (직속)</option>
                      {childs.map((c) => (
                        <option key={c.id} value={c.id}>
                          └ {c.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">
                짧은 설명
              </label>
              <input
                type="text"
                name="short_description"
                defaultValue={product.short_description ?? ''}
                placeholder="상품 카드에 한 줄로 보이는 설명"
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Top 순위 (1~100)
              </label>
              <input
                type="number"
                name="top10_rank"
                min={1}
                max={100}
                defaultValue={
                  product.top10_rank !== null
                    ? String(product.top10_rank)
                    : ''
                }
                placeholder="비워두면 순위 없음"
                className={inputBase}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                같은 순위의 기존 상품은 저장 시 자동으로 비워집니다.
              </p>
            </div>
          </div>

          <fieldset className="space-y-2 rounded-xl border bg-gray-50 p-3">
            <legend className="px-2 text-xs font-semibold text-gray-600">
              노출 · 배지
            </legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={product.is_active}
                className="mt-0.5"
              />
              <span>
                <strong className="font-medium">판매중으로 표시</strong>
                <span className="block text-xs text-gray-500">
                  체크 해제하면 쇼핑몰에서 숨겨집니다.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="is_new"
                defaultChecked={product.is_new}
                className="mt-0.5"
              />
              <span>
                <strong className="font-medium">신상품으로 표시</strong>
                <span className="block text-xs text-gray-500">
                  &lsquo;신상품&rsquo; 메뉴에 노출됩니다.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="is_sold_out"
                defaultChecked={product.is_sold_out}
                className="mt-0.5"
              />
              <span>
                <strong className="font-medium">품절</strong>
                <span className="block text-xs text-gray-500">
                  품절 배지가 붙고 구매 버튼이 비활성화됩니다.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="hide_when_sold_out"
                defaultChecked={product.hide_when_sold_out}
                className="mt-0.5"
              />
              <span>
                <strong className="font-medium">품절 시 목록에서 숨기기</strong>
                <span className="block text-xs text-gray-500">
                  품절 상태일 때 상품 목록에서도 보이지 않게 합니다.
                </span>
              </span>
            </label>
          </fieldset>

          {errorMsg ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {errorMsg}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2">
            <Link
              href={`/admin/products/${product.id}`}
              className="text-xs text-gray-500 underline hover:text-black"
            >
              전체 편집 페이지로 →
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
