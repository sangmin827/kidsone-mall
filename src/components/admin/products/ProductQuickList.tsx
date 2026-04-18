'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AdminProduct } from '@/src/server/admin-products';
import {
  quickEditProductBasics,
  quickToggleProductActive,
} from '@/src/server/admin-quick-actions';
import { deleteProduct } from '@/src/server/admin-product-actions';

type ProductWithMeta = AdminProduct & { category_name?: string | null };

type Props = {
  products: ProductWithMeta[];
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 헤더에 보여줄 필터 안내 (선택) */
  subtitle?: string;
};

type SortKey = 'default' | 'name' | 'price-asc' | 'price-desc' | 'new';

type ModalState =
  | { kind: 'product-basic'; product: AdminProduct }
  | null;

export default function ProductQuickList({
  products,
  emptyMessage = '해당하는 상품이 없습니다.',
  subtitle,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [modal, setModal] = useState<ModalState>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q) ||
            (p.category_name ?? '').toLowerCase().includes(q),
        )
      : products;

    if (sortKey === 'default') return base;
    const arr = [...base];
    switch (sortKey) {
      case 'name':
        arr.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        break;
      case 'price-asc':
        arr.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        arr.sort((a, b) => b.price - a.price);
        break;
      case 'new':
        arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
    }
    return arr;
  }, [products, query, sortKey]);

  const runAction = (label: string, fn: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await fn();
        toast.success(label);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : '작업 실패';
        toast.error(message);
      }
    });
  };

  const handleToggleActive = (p: AdminProduct) => {
    const fd = new FormData();
    fd.set('id', String(p.id));
    fd.set('next_active', p.is_active ? 'false' : 'true');
    runAction(p.is_active ? '상품을 숨겼습니다.' : '상품을 다시 노출합니다.', () =>
      quickToggleProductActive(fd),
    );
  };

  const handleDelete = (p: AdminProduct) => {
    if (
      !confirm(
        `'${p.name}' 상품을 삭제할까요?\n주문된 상품이라면 삭제 대신 "숨김" 처리됩니다.`,
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set('id', String(p.id));
    runAction('상품이 삭제되었습니다.', () => deleteProduct(fd));
  };

  const handleModalSubmit = async (fd: FormData) => {
    if (!modal) return;
    fd.set('id', String(modal.product.id));
    await quickEditProductBasics(fd);
    toast.success('상품이 수정되었습니다.');
    setModal(null);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품명 / 슬러그 / 카테고리 검색"
            className="w-full rounded-xl border px-3 py-2 text-sm md:max-w-sm"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="default">기본</option>
            <option value="name">이름순</option>
            <option value="price-asc">가격 낮은 순</option>
            <option value="price-desc">가격 높은 순</option>
            <option value="new">최신 등록순</option>
          </select>
        </div>
        <p className="text-xs text-gray-500">
          {subtitle ? `${subtitle} · ` : ''}총{' '}
          <strong>{filtered.length}</strong>개
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-gray-500">
          {query ? '검색 결과가 없습니다.' : emptyMessage}
        </div>
      ) : (
        <ul className="divide-y rounded-2xl border bg-white">
          {filtered.map((p) => (
            <li
              key={p.id}
              className={`flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                p.is_active ? '' : 'opacity-60'
              }`}
            >
              <div className="flex flex-1 items-center gap-2">
                <span aria-hidden>📄</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModal({ kind: 'product-basic', product: p })
                      }
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </button>
                    <span className="text-xs text-gray-500">/{p.slug}</span>
                    {p.category_name ? (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                        {p.category_name}
                      </span>
                    ) : null}
                    {p.is_new && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        신상품
                      </span>
                    )}
                    {p.top10_rank !== null && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                        TOP {p.top10_rank}
                      </span>
                    )}
                    {p.is_sold_out && (
                      <span className="rounded-full bg-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                        품절
                      </span>
                    )}
                    {p.is_active ? null : (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                        숨김
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {p.price.toLocaleString()}원 · 재고 {p.stock}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setModal({ kind: 'product-basic', product: p })
                  }
                  disabled={pending}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  이름/가격
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(p)}
                  disabled={pending}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  {p.is_active ? '숨기기' : '노출'}
                </button>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  상세
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  disabled={pending}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal ? (
        <QuickProductModal
          state={modal}
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
        />
      ) : null}
    </div>
  );
}

function QuickProductModal({
  state,
  onClose,
  onSubmit,
}: {
  state: NonNullable<ModalState>;
  onClose: () => void;
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      await onSubmit(fd);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '저장 실패';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            &lsquo;{state.product.name}&rsquo; 이름/가격 수정
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">상품명</label>
            <input
              type="text"
              name="name"
              defaultValue={state.product.name}
              required
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">가격 (원)</label>
            <input
              type="number"
              name="price"
              min={0}
              step={100}
              defaultValue={state.product.price}
              required
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>

          {errorMsg ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {errorMsg}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
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
        </form>
      </div>
    </div>
  );
}
