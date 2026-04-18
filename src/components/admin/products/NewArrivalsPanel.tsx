'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AdminProduct } from '@/src/server/admin-products';
import { bulkSetNewProducts } from '@/src/server/admin-bulk-actions';

type ProductWithMeta = AdminProduct & { category_name?: string | null };

type Props = {
  products: ProductWithMeta[];
};

type SortKey = 'default' | 'name' | 'price-asc' | 'price-desc' | 'new-first';

export default function NewArrivalsPanel({ products }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [checked, setChecked] = useState<Set<number>>(() => {
    const s = new Set<number>();
    for (const p of products) if (p.is_new) s.add(p.id);
    return s;
  });
  const [dirty, setDirty] = useState(false);

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
      case 'new-first':
        arr.sort((a, b) => {
          if (a.is_new !== b.is_new) return a.is_new ? -1 : 1;
          return b.created_at.localeCompare(a.created_at);
        });
        break;
    }
    return arr;
  }, [products, query, sortKey]);

  const toggle = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setDirty(true);
  };

  const checkAllVisible = () => {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const p of filtered) next.add(p.id);
      return next;
    });
    setDirty(true);
  };

  const uncheckAllVisible = () => {
    setChecked((prev) => {
      const next = new Set(prev);
      for (const p of filtered) next.delete(p.id);
      return next;
    });
    setDirty(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set('checked_ids', Array.from(checked).join(','));
        fd.set('all_ids', products.map((p) => p.id).join(','));
        await bulkSetNewProducts(fd);
        toast.success(`신상품 배지를 저장했습니다. (지정 ${checked.size}개)`);
        setDirty(false);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : '저장 실패';
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 툴바 */}
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
            <option value="new-first">신상품 먼저</option>
            <option value="name">이름순</option>
            <option value="price-asc">가격 낮은 순</option>
            <option value="price-desc">가격 높은 순</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>
            신상품 체크 <strong className="text-emerald-600">{checked.size}</strong> / 전체{' '}
            {products.length}
          </span>
          <button
            type="button"
            onClick={checkAllVisible}
            disabled={pending}
            className="rounded-lg border px-2 py-1 text-xs"
          >
            보이는 것 모두 체크
          </button>
          <button
            type="button"
            onClick={uncheckAllVisible}
            disabled={pending}
            className="rounded-lg border px-2 py-1 text-xs"
          >
            보이는 것 모두 해제
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="rounded-2xl border bg-white">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            {query ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
          </p>
        ) : (
          <ul className="divide-y">
            {filtered.map((p) => {
              const isChecked = checked.has(p.id);
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 text-sm ${
                    p.is_active ? '' : 'opacity-60'
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex flex-1 flex-wrap items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-gray-500">/{p.slug}</span>
                      {p.category_name ? (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
                          {p.category_name}
                        </span>
                      ) : null}
                      {isChecked && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          신상품
                        </span>
                      )}
                      {p.is_active ? null : (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                          숨김
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {p.price.toLocaleString()}원
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 저장 바 */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="text-xs text-gray-500">
          {dirty
            ? '변경사항이 있습니다. 저장 버튼을 눌러 적용해 주세요.'
            : '변경사항이 없습니다.'}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || !dirty}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? '저장 중…' : '신상품 배지 저장'}
        </button>
      </div>
    </div>
  );
}
