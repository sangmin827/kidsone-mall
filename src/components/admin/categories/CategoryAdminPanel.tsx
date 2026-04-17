'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AdminCategoryWithCount } from '@/src/server/admin-categories';
import {
  createCategory,
  deleteCategory,
  moveCategory,
  toggleCategoryActive,
  updateCategory,
} from '@/src/server/admin-category-actions';

type Props = {
  categories: AdminCategoryWithCount[];
};

type EditState =
  | { mode: 'create'; parentId: number | null }
  | { mode: 'edit'; category: AdminCategoryWithCount }
  | null;

export default function CategoryAdminPanel({ categories }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editState, setEditState] = useState<EditState>(null);

  const { topLevels, childrenMap, orphanChildren } = useMemo(() => {
    const tops = categories.filter((c) => c.level === 1);
    const map = new Map<number, AdminCategoryWithCount[]>();
    const orphans: AdminCategoryWithCount[] = [];
    for (const c of categories) {
      if (c.level !== 2) continue;
      if (c.parent_id === null) {
        orphans.push(c);
        continue;
      }
      const list = map.get(c.parent_id) ?? [];
      list.push(c);
      map.set(c.parent_id, list);
    }
    return { topLevels: tops, childrenMap: map, orphanChildren: orphans };
  }, [categories]);

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

  const handleDelete = (cat: AdminCategoryWithCount) => {
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

  const handleMove = (cat: AdminCategoryWithCount, direction: 'up' | 'down') => {
    const fd = new FormData();
    fd.set('id', String(cat.id));
    fd.set('direction', direction);
    runAction('', () => moveCategory(fd), { silent: true });
  };

  const handleToggleActive = (cat: AdminCategoryWithCount) => {
    const fd = new FormData();
    fd.set('id', String(cat.id));
    fd.set('next_active', cat.is_active ? 'false' : 'true');
    runAction(
      cat.is_active ? '카테고리를 숨겼습니다.' : '카테고리를 노출합니다.',
      () => toggleCategoryActive(fd),
    );
  };

  const handleSubmitForm = async (fd: FormData) => {
    if (!editState) return;

    if (editState.mode === 'create') {
      if (editState.parentId !== null) {
        fd.set('parent_id', String(editState.parentId));
      }
      try {
        await createCategory(fd);
        toast.success('카테고리가 등록되었습니다.');
        setEditState(null);
        router.refresh();
      } catch (error) {
        throw error; // 모달에서 catch 해서 메시지 표시
      }
    } else {
      fd.set('id', String(editState.category.id));
      try {
        await updateCategory(fd);
        toast.success('카테고리가 수정되었습니다.');
        setEditState(null);
        router.refresh();
      } catch (error) {
        throw error;
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          총 <strong>{categories.length}</strong>개 카테고리 (상위{' '}
          {topLevels.length}개 · 하위{' '}
          {categories.length - topLevels.length}개)
        </p>
        <button
          type="button"
          onClick={() => setEditState({ mode: 'create', parentId: null })}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + 상위 카테고리 추가
        </button>
      </div>

      {/* 카테고리 카드 리스트 */}
      {topLevels.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            아직 등록된 카테고리가 없습니다. 위 &quot;+ 상위 카테고리 추가&quot;
            버튼으로 시작하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevels.map((top, topIndex) => (
            <GroupCard
              key={top.id}
              parent={top}
              children={childrenMap.get(top.id) ?? []}
              isFirst={topIndex === 0}
              isLast={topIndex === topLevels.length - 1}
              pending={pending}
              onEdit={() => setEditState({ mode: 'edit', category: top })}
              onAddChild={() =>
                setEditState({ mode: 'create', parentId: top.id })
              }
              onMove={handleMove}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              onEditChild={(child) =>
                setEditState({ mode: 'edit', category: child })
              }
            />
          ))}

          {orphanChildren.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-800">
                상위 카테고리가 없는 하위 카테고리 ({orphanChildren.length}개)
              </p>
              <p className="mb-3 text-xs text-amber-700">
                상위가 지워지거나 연결이 끊긴 항목입니다. 수정 버튼으로 상위를
                다시 지정하거나 삭제해 주세요.
              </p>
              <ul className="divide-y divide-amber-200 rounded-xl bg-white">
                {orphanChildren.map((orphan) => (
                  <li
                    key={orphan.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span>
                      <strong>{orphan.name}</strong>
                      <span className="ml-2 text-xs text-gray-500">
                        /{orphan.slug}
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setEditState({ mode: 'edit', category: orphan })
                        }
                        disabled={pending}
                        className="rounded-lg border px-2 py-1 text-xs"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(orphan)}
                        disabled={pending}
                        className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {/* 편집 모달 */}
      {editState ? (
        <CategoryEditModal
          state={editState}
          allCategories={categories}
          onClose={() => setEditState(null)}
          onSubmit={handleSubmitForm}
        />
      ) : null}
    </div>
  );
}

/* ---------------- GroupCard: 상위 카테고리 + 하위 리스트 ---------------- */

function GroupCard({
  parent,
  children,
  isFirst,
  isLast,
  pending,
  onEdit,
  onAddChild,
  onMove,
  onToggleActive,
  onDelete,
  onEditChild,
}: {
  parent: AdminCategoryWithCount;
  children: AdminCategoryWithCount[];
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  onEdit: () => void;
  onAddChild: () => void;
  onMove: (cat: AdminCategoryWithCount, direction: 'up' | 'down') => void;
  onToggleActive: (cat: AdminCategoryWithCount) => void;
  onDelete: (cat: AdminCategoryWithCount) => void;
  onEditChild: (cat: AdminCategoryWithCount) => void;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-white ${
        parent.is_active ? '' : 'opacity-75'
      }`}
    >
      {/* 헤더 */}
      <header className="flex flex-col gap-3 border-b bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{parent.name}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">
              /{parent.slug}
            </span>
            {parent.is_active ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                노출중
              </span>
            ) : (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                숨김
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            상품 {parent.product_count}개 · 하위 카테고리 {parent.child_count}개
            · 정렬 {parent.sort_order}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(parent, 'up')}
            disabled={pending || isFirst}
            className="rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
            title="위로"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(parent, 'down')}
            disabled={pending || isLast}
            className="rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
            title="아래로"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onToggleActive(parent)}
            disabled={pending}
            className="rounded-lg border px-3 py-1 text-xs"
          >
            {parent.is_active ? '숨기기' : '노출'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={pending}
            className="rounded-lg border px-3 py-1 text-xs"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onDelete(parent)}
            disabled={pending}
            className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-600"
          >
            삭제
          </button>
        </div>
      </header>

      {/* 바디: 하위 카테고리 리스트 */}
      <div className="divide-y">
        {children.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-gray-400">
            등록된 하위 카테고리가 없습니다.
          </p>
        ) : (
          children.map((child, idx) => (
            <div
              key={child.id}
              className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                child.is_active ? '' : 'opacity-60'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">└ {child.name}</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                    /{child.slug}
                  </span>
                  {child.is_active ? null : (
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                      숨김
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  상품 {child.product_count}개 · 정렬 {child.sort_order}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => onMove(child, 'up')}
                  disabled={pending || idx === 0}
                  className="rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove(child, 'down')}
                  disabled={pending || idx === children.length - 1}
                  className="rounded-lg border px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onToggleActive(child)}
                  disabled={pending}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  {child.is_active ? '숨기기' : '노출'}
                </button>
                <button
                  type="button"
                  onClick={() => onEditChild(child)}
                  disabled={pending}
                  className="rounded-lg border px-2 py-1 text-xs"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(child)}
                  disabled={pending}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 푸터: 하위 추가 */}
      <footer className="border-t bg-gray-50/60 px-4 py-2">
        <button
          type="button"
          onClick={onAddChild}
          disabled={pending}
          className="text-xs font-medium text-gray-700 hover:text-black"
        >
          + 하위 카테고리 추가
        </button>
      </footer>
    </section>
  );
}

/* ---------------- CategoryEditModal ---------------- */

function CategoryEditModal({
  state,
  allCategories,
  onClose,
  onSubmit,
}: {
  state: NonNullable<EditState>;
  allCategories: AdminCategoryWithCount[];
  onClose: () => void;
  onSubmit: (fd: FormData) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEdit = state.mode === 'edit';
  const initial = isEdit ? state.category : null;
  const fixedParentId = !isEdit ? state.parentId : undefined;

  const parentOptions = allCategories.filter(
    (c) => c.level === 1 && (!isEdit || c.id !== initial?.id),
  );

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

  const title = isEdit
    ? `'${initial!.name}' 수정`
    : state.parentId === null
      ? '상위 카테고리 추가'
      : '하위 카테고리 추가';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
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
          <div>
            <label className="mb-1 block text-sm font-medium">
              카테고리명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              defaultValue={initial?.name ?? ''}
              placeholder="예: 유아체육"
              required
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
              defaultValue={initial?.slug ?? ''}
              placeholder="예: kids-sports"
              required
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              영문 소문자·숫자·하이픈(-) 권장. URL 에 그대로 사용됩니다.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              상위 카테고리
            </label>
            <select
              name="parent_id"
              defaultValue={
                isEdit
                  ? initial?.parent_id !== null && initial?.parent_id !== undefined
                    ? String(initial.parent_id)
                    : ''
                  : fixedParentId !== null && fixedParentId !== undefined
                    ? String(fixedParentId)
                    : ''
              }
              disabled={!isEdit && fixedParentId !== null}
              className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-gray-100"
            >
              <option value="">없음 (대분류)</option>
              {parentOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {!isEdit && fixedParentId !== null ? (
              <p className="mt-1 text-xs text-gray-500">
                하위 카테고리 추가 — 상위는 자동으로 지정됩니다.
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              정렬 순서
            </label>
            <input
              type="number"
              name="sort_order"
              defaultValue={initial?.sort_order ?? 0}
              className="w-full rounded-xl border px-3 py-2 text-sm md:w-40"
            />
            <p className="mt-1 text-xs text-gray-500">
              숫자가 작을수록 먼저 표시됩니다. 목록에서 ↑↓ 버튼으로도 변경
              가능합니다.
            </p>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial ? initial.is_active : true}
              className="mt-0.5"
            />
            <span>
              <strong className="font-medium">쇼핑몰에 노출</strong>
              <span className="block text-xs text-gray-500">
                체크 해제 시 숨겨집니다. 연결된 상품은 유지되지만 이 카테고리로
                진입할 수 없게 됩니다.
              </span>
            </span>
          </label>

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
                ? '저장 중...'
                : isEdit
                  ? '수정 저장'
                  : '카테고리 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
