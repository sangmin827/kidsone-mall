'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import type {
  CatalogCategoryNode,
  CatalogTree,
} from '@/src/server/admin-catalog';
import type { AdminProduct } from '@/src/server/admin-products';
import type { AdminCategory } from '@/src/server/admin-categories';
import {
  createCategory,
  deleteCategory,
  moveCategory,
  toggleCategoryActive,
} from '@/src/server/admin-category-actions';
import { deleteProduct } from '@/src/server/admin-product-actions';
import {
  quickChangeProductCategory,
  quickEditCategoryBasics,
  quickEditProductBasics,
  quickToggleProductActive,
} from '@/src/server/admin-quick-actions';
import ProductDetailModal from '@/src/components/admin/products/ProductDetailModal';

type Props = {
  tree: CatalogTree;
};

type SortKey = 'default' | 'name' | 'price-asc' | 'price-desc' | 'new';

type CategoryEditModalState =
  | { kind: 'category-basic'; category: CatalogCategoryNode }
  | {
      kind: 'category-create';
      parentId: number | null;
      parentName: string | null;
    }
  | { kind: 'product-basic'; product: AdminProduct }
  | null;

export default function CatalogTreePanel({ tree }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    // 기본: 상위 카테고리 전부 펼침
    const init: Record<number, boolean> = {};
    for (const r of tree.roots) init[r.id] = true;
    return init;
  });
  const [modal, setModal] = useState<CategoryEditModalState>(null);
  const [detailProduct, setDetailProduct] = useState<AdminProduct | null>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const filteredTree = useMemo(
    () => filterAndSortTree(tree.roots, trimmedQuery, sortKey),
    [tree.roots, trimmedQuery, sortKey],
  );

  const runAction = (
    label: string,
    fn: () => Promise<void>,
    { silent = false }: { silent?: boolean } = {},
  ) => {
    startTransition(async () => {
      try {
        await fn();
        if (!silent) toast.success(label);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : '작업 실패';
        toast.error(message);
      }
    });
  };

  const toggleExpand = (id: number) => {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  };

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    walkAll(tree.roots, (node) => {
      next[node.id] = true;
    });
    setExpanded(next);
  };

  const collapseAll = () => setExpanded({});

  /* ---------------- Category actions ---------------- */

  const handleMoveCategory = (
    cat: CatalogCategoryNode,
    direction: 'up' | 'down',
  ) => {
    const fd = new FormData();
    fd.set('id', String(cat.id));
    fd.set('direction', direction);
    runAction('', () => moveCategory(fd), { silent: true });
  };

  const handleToggleCategoryActive = (cat: CatalogCategoryNode) => {
    const fd = new FormData();
    fd.set('id', String(cat.id));
    fd.set('next_active', cat.is_active ? 'false' : 'true');
    runAction(
      cat.is_active
        ? '카테고리를 숨겼습니다.'
        : '카테고리를 다시 노출합니다.',
      () => toggleCategoryActive(fd),
    );
  };

  const handleDeleteCategory = (cat: CatalogCategoryNode) => {
    if (
      !confirm(
        `'${cat.name}' 카테고리를 삭제할까요?\n(연결된 상품이나 하위 카테고리가 있으면 삭제할 수 없습니다.)`,
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set('id', String(cat.id));
    runAction('카테고리가 삭제되었습니다.', () => deleteCategory(fd));
  };

  /* ---------------- Product actions ---------------- */

  const handleChangeProductCategory = (
    product: AdminProduct,
    newCategoryId: number,
  ) => {
    if (product.category_id === newCategoryId) return;
    const fd = new FormData();
    fd.set('id', String(product.id));
    fd.set('category_id', String(newCategoryId));
    runAction(`'${product.name}' 카테고리를 변경했습니다.`, () =>
      quickChangeProductCategory(fd),
    );
  };

  const handleToggleProductActive = (product: AdminProduct) => {
    const fd = new FormData();
    fd.set('id', String(product.id));
    fd.set('next_active', product.is_active ? 'false' : 'true');
    runAction(
      product.is_active ? '상품을 숨겼습니다.' : '상품을 다시 노출합니다.',
      () => quickToggleProductActive(fd),
    );
  };

  const handleDeleteProduct = (product: AdminProduct) => {
    if (
      !confirm(
        `'${product.name}' 상품을 삭제할까요?\n주문된 상품이라면 삭제 대신 "숨김" 처리됩니다.`,
      )
    ) {
      return;
    }
    const fd = new FormData();
    fd.set('id', String(product.id));
    runAction('상품이 삭제되었습니다.', () => deleteProduct(fd));
  };

  /* ---------------- Modal submit ---------------- */

  const handleModalSubmit = async (fd: FormData) => {
    if (!modal) return;
    if (modal.kind === 'category-basic') {
      fd.set('id', String(modal.category.id));
      await quickEditCategoryBasics(fd);
      toast.success('카테고리가 수정되었습니다.');
    } else if (modal.kind === 'category-create') {
      if (modal.parentId !== null) {
        fd.set('parent_id', String(modal.parentId));
      }
      // 기본: 노출 상태로 생성
      fd.set('is_active', 'on');
      await createCategory(fd);
      toast.success('카테고리가 추가되었습니다.');
    } else {
      fd.set('id', String(modal.product.id));
      await quickEditProductBasics(fd);
      toast.success('상품이 수정되었습니다.');
    }
    setModal(null);
    router.refresh();
  };

  const totalMatched = useMemo(() => {
    let c = 0;
    let p = 0;
    walkAll(filteredTree, (node) => {
      c += 1;
      p += node.products.length;
    });
    return { c, p };
  }, [filteredTree]);

  return (
    <div className="space-y-5">
      {/* 검색/정렬 툴바 */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="카테고리명 / 상품명 / 슬러그로 검색"
            className="w-full rounded-xl border px-3 py-2 text-sm md:max-w-sm"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border px-3 py-2 text-sm"
            aria-label="정렬 기준"
          >
            <option value="default">기본(등록순)</option>
            <option value="name">이름순 (가나다)</option>
            <option value="price-asc">가격 낮은 순</option>
            <option value="price-desc">가격 높은 순</option>
            <option value="new">최신 등록순</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>
            카테고리 <strong>{totalMatched.c}</strong>개 · 상품{' '}
            <strong>{totalMatched.p}</strong>개
          </span>
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border px-2 py-1 text-xs"
          >
            모두 펼치기
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border px-2 py-1 text-xs"
          >
            모두 접기
          </button>
          <button
            type="button"
            onClick={() =>
              setModal({
                kind: 'category-create',
                parentId: null,
                parentName: null,
              })
            }
            className="rounded-xl border border-black bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-50"
          >
            + 카테고리 추가
          </button>
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-black px-3 py-1.5 text-xs font-medium text-white"
          >
            + 상품 등록
          </Link>
        </div>
      </div>

      {/* 트리 본체 */}
      {filteredTree.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-gray-500">
          {trimmedQuery
            ? '검색 결과가 없습니다.'
            : '등록된 카테고리가 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTree.map((node, idx) => (
            <CategoryNode
              key={node.id}
              node={node}
              depth={0}
              pending={pending}
              expanded={expanded}
              allCategories={tree.allCategories}
              isFirst={idx === 0}
              isLast={idx === filteredTree.length - 1}
              onToggleExpand={toggleExpand}
              onEditCategory={(c) =>
                setModal({ kind: 'category-basic', category: c })
              }
              onCreateSubcategory={(parent) =>
                setModal({
                  kind: 'category-create',
                  parentId: parent.id,
                  parentName: parent.name,
                })
              }
              onEditProduct={(p) =>
                setModal({ kind: 'product-basic', product: p })
              }
              onShowProductDetail={(p) => setDetailProduct(p)}
              onMoveCategory={handleMoveCategory}
              onToggleCategoryActive={handleToggleCategoryActive}
              onDeleteCategory={handleDeleteCategory}
              onChangeProductCategory={handleChangeProductCategory}
              onToggleProductActive={handleToggleProductActive}
              onDeleteProduct={handleDeleteProduct}
            />
          ))}
        </div>
      )}

      {/* orphan 상품/카테고리 안내 */}
      {tree.orphanProducts.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-semibold text-amber-800">
            카테고리가 지정되지 않은 상품 ({tree.orphanProducts.length}개)
          </p>
          <ul className="divide-y divide-amber-200 rounded-xl bg-white">
            {tree.orphanProducts.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <strong>{p.name}</strong>
                  <span className="ml-2 text-xs text-gray-500">/{p.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CategorySelect
                    categories={tree.allCategories}
                    value={p.category_id}
                    onChange={(newId) => handleChangeProductCategory(p, newId)}
                    disabled={pending}
                  />
                  <button
                    type="button"
                    onClick={() => setDetailProduct(p)}
                    disabled={pending}
                    className="rounded-lg border px-2 py-1 text-xs"
                  >
                    상세
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 모달 */}
      {modal ? (
        <QuickEditModal
          state={modal}
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
        />
      ) : null}

      {detailProduct ? (
        <ProductDetailModal
          product={detailProduct}
          allCategories={tree.allCategories}
          onClose={() => setDetailProduct(null)}
        />
      ) : null}
    </div>
  );
}

/* ====================== CategoryNode (재귀) ====================== */

type CategoryNodeProps = {
  node: CatalogCategoryNode;
  depth: number;
  pending: boolean;
  expanded: Record<number, boolean>;
  allCategories: AdminCategory[];
  isFirst: boolean;
  isLast: boolean;
  onToggleExpand: (id: number) => void;
  onEditCategory: (c: CatalogCategoryNode) => void;
  onCreateSubcategory: (parent: CatalogCategoryNode) => void;
  onEditProduct: (p: AdminProduct) => void;
  onShowProductDetail: (p: AdminProduct) => void;
  onMoveCategory: (c: CatalogCategoryNode, direction: 'up' | 'down') => void;
  onToggleCategoryActive: (c: CatalogCategoryNode) => void;
  onDeleteCategory: (c: CatalogCategoryNode) => void;
  onChangeProductCategory: (p: AdminProduct, newId: number) => void;
  onToggleProductActive: (p: AdminProduct) => void;
  onDeleteProduct: (p: AdminProduct) => void;
};

function CategoryNode(props: CategoryNodeProps) {
  const {
    node,
    depth,
    pending,
    expanded,
    allCategories,
    isFirst,
    isLast,
    onToggleExpand,
    onEditCategory,
    onCreateSubcategory,
    onEditProduct,
    onShowProductDetail,
    onMoveCategory,
    onToggleCategoryActive,
    onDeleteCategory,
    onChangeProductCategory,
    onToggleProductActive,
    onDeleteProduct,
  } = props;

  const isOpen = expanded[node.id] ?? false;
  const indentPx = depth * 16;

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white ${
        node.is_active ? '' : 'opacity-75'
      }`}
    >
      {/* 헤더 */}
      <header
        className="flex flex-col gap-3 border-b bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ paddingLeft: 16 + indentPx }}
      >
        <div className="flex flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="rounded p-1 text-gray-500 hover:bg-gray-200"
            aria-label={isOpen ? '접기' : '펼치기'}
            title={isOpen ? '접기' : '펼치기'}
          >
            <span aria-hidden className="inline-block w-3 text-center">
              {isOpen ? '▾' : '▸'}
            </span>
          </button>
          <span aria-hidden className="text-lg">
            {isOpen ? '📂' : '📁'}
          </span>

          <button
            type="button"
            onClick={() => onEditCategory(node)}
            className="group flex flex-wrap items-center gap-2 text-left"
            title="이름 빠른 수정"
          >
            <h3 className="text-base font-semibold group-hover:underline">
              {node.name}
            </h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">
              /{node.slug}
            </span>
            {node.is_active ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                노출중
              </span>
            ) : (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                숨김
              </span>
            )}
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              하위 {node.child_count}개 · 상품 {node.product_count}개
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveCategory(node, 'up')}
            disabled={pending || isFirst}
            className="rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
            title="위로"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveCategory(node, 'down')}
            disabled={pending || isLast}
            className="rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
            title="아래로"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onToggleCategoryActive(node)}
            disabled={pending}
            className="rounded-lg border px-3 py-1 text-xs"
          >
            {node.is_active ? '숨기기' : '노출'}
          </button>
          <button
            type="button"
            onClick={() => onEditCategory(node)}
            disabled={pending}
            className="rounded-lg border px-3 py-1 text-xs"
          >
            이름 수정
          </button>
          {depth === 0 ? (
            <button
              type="button"
              onClick={() => onCreateSubcategory(node)}
              disabled={pending}
              className="rounded-lg border border-blue-300 px-3 py-1 text-xs text-blue-700 hover:bg-blue-50"
              title="이 카테고리 아래에 하위 카테고리 추가"
            >
              + 하위
            </button>
          ) : null}
          <Link
            href="/admin/categories"
            className="rounded-lg border px-3 py-1 text-xs"
            title="카테고리 상세 관리(상위 이동 등)"
          >
            상세
          </Link>
          <button
            type="button"
            onClick={() => onDeleteCategory(node)}
            disabled={pending}
            className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
          >
            삭제
          </button>
        </div>
      </header>

      {/* 본문: 자식 카테고리 + 상품들 */}
      {isOpen ? (
        <div
          className="divide-y"
          style={{ paddingLeft: indentPx > 0 ? indentPx : 0 }}
        >
          {/* 하위 카테고리 (재귀) */}
          {node.children.length > 0 ? (
            <div className="space-y-2 p-2">
              {node.children.map((child, idx) => (
                <CategoryNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  pending={pending}
                  expanded={expanded}
                  allCategories={allCategories}
                  isFirst={idx === 0}
                  isLast={idx === node.children.length - 1}
                  onToggleExpand={onToggleExpand}
                  onEditCategory={onEditCategory}
                  onCreateSubcategory={onCreateSubcategory}
                  onEditProduct={onEditProduct}
                  onShowProductDetail={onShowProductDetail}
                  onMoveCategory={onMoveCategory}
                  onToggleCategoryActive={onToggleCategoryActive}
                  onDeleteCategory={onDeleteCategory}
                  onChangeProductCategory={onChangeProductCategory}
                  onToggleProductActive={onToggleProductActive}
                  onDeleteProduct={onDeleteProduct}
                />
              ))}
            </div>
          ) : null}

          {/* 이 카테고리 직속 상품들 */}
          {node.products.length > 0 ? (
            <ul className="divide-y">
              {node.products.map((p) => (
                <li
                  key={p.id}
                  className={`flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                    p.is_active ? '' : 'opacity-60'
                  }`}
                  style={{ paddingLeft: 32 + indentPx }}
                >
                  <div className="flex flex-1 items-center gap-2">
                    <span aria-hidden>📄</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="font-medium hover:underline"
                          title="이름/가격 빠른 수정"
                        >
                          {p.name}
                        </button>
                        <span className="text-xs text-gray-500">
                          /{p.slug}
                        </span>
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
                            품절{p.hide_when_sold_out ? '·숨김' : ''}
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
                    <CategorySelect
                      categories={allCategories}
                      value={p.category_id}
                      onChange={(newId) => onChangeProductCategory(p, newId)}
                      disabled={pending}
                    />
                    <button
                      type="button"
                      onClick={() => onEditProduct(p)}
                      disabled={pending}
                      className="rounded-lg border px-2 py-1 text-xs"
                    >
                      이름/가격
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleProductActive(p)}
                      disabled={pending}
                      className="rounded-lg border px-2 py-1 text-xs"
                    >
                      {p.is_active ? '숨기기' : '노출'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowProductDetail(p)}
                      disabled={pending}
                      className="rounded-lg border px-2 py-1 text-xs"
                    >
                      상세
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(p)}
                      disabled={pending}
                      className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {node.children.length === 0 && node.products.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-gray-400">
              비어 있는 카테고리입니다.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/* ====================== CategorySelect ====================== */

function CategorySelect({
  categories,
  value,
  onChange,
  disabled,
}: {
  categories: AdminCategory[];
  value: number | null;
  onChange: (newId: number) => void;
  disabled?: boolean;
}) {
  // parent → children 맵
  const { parents, childrenByParent } = useMemo(() => {
    const ps: AdminCategory[] = [];
    const byParent = new Map<number, AdminCategory[]>();
    for (const c of categories) {
      if (c.level === 1 || c.parent_id === null) {
        ps.push(c);
      } else {
        const list = byParent.get(c.parent_id) ?? [];
        list.push(c);
        byParent.set(c.parent_id, list);
      }
    }
    return { parents: ps, childrenByParent: byParent };
  }, [categories]);

  return (
    <select
      value={value !== null ? String(value) : ''}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return;
        onChange(Number(v));
      }}
      disabled={disabled}
      className="rounded-lg border px-2 py-1 text-xs"
      title="카테고리 변경 (바로 저장됨)"
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
  );
}

/* ====================== QuickEditModal ====================== */

function QuickEditModal({
  state,
  onClose,
  onSubmit,
}: {
  state: NonNullable<CategoryEditModalState>;
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

  const title =
    state.kind === 'category-basic'
      ? `'${state.category.name}' 이름 수정`
      : state.kind === 'category-create'
        ? state.parentId === null
          ? '새 카테고리 추가 (최상위)'
          : `'${state.parentName ?? ''}' 아래에 하위 카테고리 추가`
        : `'${state.product.name}' 이름/가격 수정`;

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
          <h3 className="text-lg font-semibold">{title}</h3>
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
          {state.kind === 'category-basic' ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  카테고리명
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={state.category.name}
                  required
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  슬러그 (URL)
                </label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={state.category.slug}
                  required
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  슬러그 변경은 외부 링크에 영향이 갈 수 있어요.
                </p>
              </div>
            </>
          ) : state.kind === 'category-create' ? (
            <>
              {state.parentName ? (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  상위 카테고리:{' '}
                  <strong className="font-semibold">{state.parentName}</strong>
                </p>
              ) : (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  최상위 카테고리로 등록됩니다.
                </p>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  카테고리명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="예: 남아 티셔츠"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  슬러그 (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="예: boys-tshirts (영문·숫자·하이픈)"
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  주소창에 표시되는 값입니다. 영문 소문자·숫자·하이픈(-) 권장.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  정렬 순서
                </label>
                <input
                  type="number"
                  name="sort_order"
                  defaultValue={0}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  작은 숫자가 먼저 표시됩니다. 나중에 ↑↓ 버튼으로도 조절 가능해요.
                </p>
              </div>
            </>
          ) : (
            <>
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
                <label className="mb-1 block text-sm font-medium">
                  가격 (원)
                </label>
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
            </>
          )}

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
              {submitting
                ? state.kind === 'category-create'
                  ? '추가 중…'
                  : '저장 중…'
                : state.kind === 'category-create'
                  ? '추가'
                  : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ====================== Helpers ====================== */

function walkAll(
  nodes: CatalogCategoryNode[],
  cb: (n: CatalogCategoryNode) => void,
) {
  for (const n of nodes) {
    cb(n);
    if (n.children.length) walkAll(n.children, cb);
  }
}

function matchesCategory(n: CatalogCategoryNode, q: string): boolean {
  if (!q) return true;
  if (n.name.toLowerCase().includes(q)) return true;
  if (n.slug.toLowerCase().includes(q)) return true;
  return false;
}

function matchesProduct(p: AdminProduct, q: string): boolean {
  if (!q) return true;
  if (p.name.toLowerCase().includes(q)) return true;
  if (p.slug.toLowerCase().includes(q)) return true;
  return false;
}

function sortProducts(
  products: AdminProduct[],
  key: SortKey,
): AdminProduct[] {
  if (key === 'default') return products;
  const arr = [...products];
  switch (key) {
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
}

/**
 * 트리 필터 + 정렬.
 * - 카테고리명 또는 그 안의 상품이 검색어와 매치되면 해당 노드(와 조상 체인)를 유지.
 * - 매치되지 않는 상품은 걸러서 표시.
 */
function filterAndSortTree(
  roots: CatalogCategoryNode[],
  query: string,
  sortKey: SortKey,
): CatalogCategoryNode[] {
  const result: CatalogCategoryNode[] = [];

  for (const root of roots) {
    const filtered = filterNode(root, query, sortKey);
    if (filtered) result.push(filtered);
  }

  return result;
}

function filterNode(
  node: CatalogCategoryNode,
  query: string,
  sortKey: SortKey,
): CatalogCategoryNode | null {
  const matchedProducts = node.products.filter((p) => matchesProduct(p, query));
  const matchedChildren: CatalogCategoryNode[] = [];
  for (const c of node.children) {
    const fc = filterNode(c, query, sortKey);
    if (fc) matchedChildren.push(fc);
  }

  const selfMatched = matchesCategory(node, query);
  const hasContent = matchedProducts.length > 0 || matchedChildren.length > 0;

  if (!selfMatched && !hasContent) {
    return null;
  }

  // 카테고리 자체가 매치되면 자식 전부 유지, 아니면 매치된 것만 유지
  const productsForNode = selfMatched
    ? sortProducts(node.products, sortKey)
    : sortProducts(matchedProducts, sortKey);

  const childrenForNode = selfMatched
    ? node.children
        .map((c) => filterNode(c, '', sortKey))
        .filter((x): x is CatalogCategoryNode => !!x)
    : matchedChildren;

  return {
    ...node,
    products: productsForNode,
    children: childrenForNode,
  };
}
