'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AdminProduct } from '@/src/server/admin-products';
import { bulkSetTop100Rankings } from '@/src/server/admin-bulk-actions';

type ProductWithMeta = AdminProduct & { category_name?: string | null };

type Props = {
  products: ProductWithMeta[];
};

const MAX_RANK = 100;

export default function Top100Panel({ products }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [dirty, setDirty] = useState(false);

  // 순위 리스트: 인덱스 0 → 1위
  // 초기값은 기존 top10_rank 기준으로 정렬
  const [ranked, setRanked] = useState<number[]>(() => {
    const withRank = products
      .filter((p) => p.top10_rank !== null)
      .sort((a, b) => (a.top10_rank ?? 999) - (b.top10_rank ?? 999))
      .map((p) => p.id);
    return withRank;
  });

  const productMap = useMemo(() => {
    const m = new Map<number, ProductWithMeta>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const rankedSet = useMemo(() => new Set(ranked), [ranked]);

  const unrankedFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !rankedSet.has(p.id))
      .filter((p) =>
        q
          ? p.name.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q) ||
            (p.category_name ?? '').toLowerCase().includes(q)
          : true,
      );
  }, [products, query, rankedSet]);

  const addToRank = (id: number) => {
    if (ranked.length >= MAX_RANK) {
      toast.error(`최대 ${MAX_RANK}위까지만 지정할 수 있습니다.`);
      return;
    }
    if (rankedSet.has(id)) return;
    setRanked((prev) => [...prev, id]);
    setDirty(true);
  };

  const removeFromRank = (id: number) => {
    setRanked((prev) => prev.filter((x) => x !== id));
    setDirty(true);
  };

  const moveRank = (id: number, direction: 'up' | 'down') => {
    setRanked((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
    setDirty(true);
  };

  const moveToTop = (id: number) => {
    setRanked((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
    setDirty(true);
  };

  /* ---------- drag & drop (HTML5 native) ---------- */
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);

  const onDragStart = (id: number) => (e: React.DragEvent) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
  };

  const onDragOver = (id: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overId !== id) setOverId(id);
  };

  const onDrop = (targetId: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const src = dragId;
    setDragId(null);
    setOverId(null);
    if (src === null || src === targetId) return;

    setRanked((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(src);
      const toIdx = next.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = next.splice(fromIdx, 1);
      // 위에서 아래로 옮기면 splice 후 toIdx 가 -1 해야 맞음
      const adjustedTo = fromIdx < toIdx ? toIdx : toIdx;
      next.splice(adjustedTo, 0, item);
      return next;
    });
    setDirty(true);
  };

  const onDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  /* ---------- save ---------- */
  const handleSave = () => {
    if (ranked.length > MAX_RANK) {
      toast.error(`1~${MAX_RANK}위까지만 저장할 수 있습니다.`);
      return;
    }

    startTransition(async () => {
      try {
        const rankings = ranked.map((id, idx) => ({ id, rank: idx + 1 }));
        const fd = new FormData();
        fd.set('rankings', JSON.stringify(rankings));
        fd.set('all_ids', products.map((p) => p.id).join(','));

        await bulkSetTop100Rankings(fd);
        toast.success(`Top ${ranked.length} 순위를 저장했습니다.`);
        setDirty(false);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : '저장 실패';
        toast.error(message);
      }
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 왼쪽: 순위 리스트 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl border bg-white px-4 py-3">
          <div>
            <h2 className="text-base font-semibold">순위 ({ranked.length} / {MAX_RANK})</h2>
            <p className="text-xs text-gray-500">
              드래그해서 순서를 바꾸거나 ↑↓ 버튼을 사용하세요. 1~10위는 홈화면,
              11~{MAX_RANK}위는 Top 10 페이지에만 노출됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !dirty}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? '저장 중…' : '순위 저장'}
          </button>
        </div>

        <ol className="rounded-2xl border bg-white">
          {ranked.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-gray-400">
              아직 지정된 순위가 없습니다. 오른쪽 목록에서 상품을 추가해 주세요.
            </li>
          ) : (
            ranked.map((id, idx) => {
              const p = productMap.get(id);
              if (!p) return null;
              const rank = idx + 1;
              const isTopTen = rank <= 10;
              const isOver = overId === id;
              const isDragging = dragId === id;

              return (
                <li
                  key={id}
                  draggable
                  onDragStart={onDragStart(id)}
                  onDragOver={onDragOver(id)}
                  onDrop={onDrop(id)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 ${
                    isOver ? 'bg-blue-50' : ''
                  } ${isDragging ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`flex h-7 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isTopTen
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    title={isTopTen ? '홈화면에도 노출' : 'Top 10 페이지에만 노출'}
                  >
                    {rank}
                  </span>

                  <span
                    aria-hidden
                    className="cursor-grab select-none text-gray-400"
                    title="드래그"
                  >
                    ⋮⋮
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {p.category_name ?? '(카테고리 없음)'} ·{' '}
                      {p.price.toLocaleString()}원
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveToTop(id)}
                      disabled={idx === 0}
                      className="rounded border px-1.5 py-0.5 text-[11px] disabled:opacity-40"
                      title="1위로"
                    >
                      ⤒
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRank(id, 'up')}
                      disabled={idx === 0}
                      className="rounded border px-1.5 py-0.5 text-[11px] disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRank(id, 'down')}
                      disabled={idx === ranked.length - 1}
                      className="rounded border px-1.5 py-0.5 text-[11px] disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromRank(id)}
                      className="rounded border border-rose-200 px-1.5 py-0.5 text-[11px] text-rose-600"
                      title="순위에서 제외"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ol>
      </section>

      {/* 오른쪽: 후보 상품 */}
      <section className="space-y-3">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-base font-semibold">후보 상품</h2>
          <p className="text-xs text-gray-500">
            + 버튼으로 순위 목록에 추가하세요. 이미 순위가 지정된 상품은 여기에서
            빠져 있습니다.
          </p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품명 / 슬러그 / 카테고리 검색"
            className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
          />
        </div>

        <ul className="max-h-[600px] overflow-y-auto rounded-2xl border bg-white">
          {unrankedFiltered.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-gray-400">
              {query
                ? '검색 결과가 없습니다.'
                : '추가할 수 있는 상품이 없습니다.'}
            </li>
          ) : (
            unrankedFiltered.map((p) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 border-b px-3 py-2 text-sm last:border-b-0 ${
                  p.is_active ? '' : 'opacity-60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {p.category_name ?? '(카테고리 없음)'} ·{' '}
                    {p.price.toLocaleString()}원
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addToRank(p.id)}
                  disabled={ranked.length >= MAX_RANK}
                  className="rounded border px-2 py-0.5 text-xs disabled:opacity-40"
                  title="순위에 추가"
                >
                  + 추가
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
