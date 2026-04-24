"use client";

import { useState, useTransition } from "react";
import type { ProductOptionGroup } from "@/src/server/admin-option-actions";
import {
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOptionValue,
  updateOptionValue,
  deleteOptionValue,
} from "@/src/server/admin-option-actions";

type Props = {
  productId: number;
  initialGroups: ProductOptionGroup[];
};

const inputCls =
  "w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";
const btnPrimary =
  "rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnDanger =
  "rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50";

export default function ProductOptionManager({ productId, initialGroups }: Props) {
  const [groups, setGroups] = useState<ProductOptionGroup[]>(initialGroups);
  const [isPending, startTransition] = useTransition();

  // ── 그룹 추가 ──────────────────────────────────
  const [newGroupName, setNewGroupName] = useState("");

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const fd = new FormData();
    fd.append("product_id", String(productId));
    fd.append("name", newGroupName.trim());
    fd.append("sort_order", String(groups.length));

    startTransition(async () => {
      const { id: newId } = await createOptionGroup(fd);
      setGroups((prev) => [
        ...prev,
        {
          id: newId,
          product_id: productId,
          name: newGroupName.trim(),
          sort_order: prev.length,
          option_values: [],
        },
      ]);
      setNewGroupName("");
    });
  };

  // ── 그룹 이름 수정 ──────────────────────────────
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  const handleUpdateGroup = (groupId: number) => {
    const fd = new FormData();
    fd.append("id", String(groupId));
    fd.append("product_id", String(productId));
    fd.append("name", editingGroupName.trim());

    startTransition(async () => {
      await updateOptionGroup(fd);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
        )
      );
      setEditingGroupId(null);
    });
  };

  // ── 그룹 삭제 ──────────────────────────────────
  const handleDeleteGroup = (groupId: number) => {
    if (!window.confirm("이 옵션 그룹과 하위 값이 모두 삭제됩니다. 계속할까요?")) return;
    const fd = new FormData();
    fd.append("id", String(groupId));
    fd.append("product_id", String(productId));

    startTransition(async () => {
      await deleteOptionGroup(fd);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    });
  };

  // ── 옵션 값 추가 ────────────────────────────────
  const [newValues, setNewValues] = useState<
    Record<number, { value: string; priceDelta: string; stock: string; isSoldOut: boolean; isHidden: boolean }>
  >({});

  const getNewValue = (groupId: number) =>
    newValues[groupId] ?? { value: "", priceDelta: "0", stock: "0", isSoldOut: false, isHidden: false };

  const setNewValue = (
    groupId: number,
    patch: Partial<{ value: string; priceDelta: string; stock: string; isSoldOut: boolean; isHidden: boolean }>
  ) =>
    setNewValues((prev) => ({
      ...prev,
      [groupId]: { ...getNewValue(groupId), ...patch },
    }));

  const handleAddValue = (groupId: number) => {
    const nv = getNewValue(groupId);
    if (!nv.value.trim()) return;
    const fd = new FormData();
    fd.append("group_id", String(groupId));
    fd.append("product_id", String(productId));
    fd.append("value", nv.value.trim());
    fd.append("price_delta", nv.priceDelta);
    fd.append("stock", nv.stock);
    fd.append("sort_order", String(groups.find((g) => g.id === groupId)?.option_values.length ?? 0));
    if (nv.isSoldOut) fd.append("is_sold_out", "on");
    if (nv.isHidden) fd.append("is_hidden", "on");

    startTransition(async () => {
      await createOptionValue(fd);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                option_values: [
                  ...g.option_values,
                  {
                    id: Date.now(),
                    group_id: groupId,
                    value: nv.value.trim(),
                    price_delta: Number(nv.priceDelta) || 0,
                    stock: Number(nv.stock) || 0,
                    is_sold_out: nv.isSoldOut,
                    is_hidden: nv.isHidden,
                    sort_order: g.option_values.length,
                  },
                ],
              }
            : g
        )
      );
      setNewValues((prev) => ({
        ...prev,
        [groupId]: { value: "", priceDelta: "0", stock: "0", isSoldOut: false, isHidden: false },
      }));
    });
  };

  // ── 옵션 값 수정 ────────────────────────────────
  const [editingValueId, setEditingValueId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState({
    value: "",
    priceDelta: "0",
    stock: "0",
    isSoldOut: false,
    isHidden: false,
  });

  const handleUpdateValue = (valueId: number, groupId: number) => {
    const fd = new FormData();
    fd.append("id", String(valueId));
    fd.append("product_id", String(productId));
    fd.append("value", editingValue.value.trim());
    fd.append("price_delta", editingValue.priceDelta);
    fd.append("stock", editingValue.stock);
    if (editingValue.isSoldOut) fd.append("is_sold_out", "on");
    if (editingValue.isHidden) fd.append("is_hidden", "on");

    startTransition(async () => {
      await updateOptionValue(fd);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                option_values: g.option_values.map((v) =>
                  v.id === valueId
                    ? {
                        ...v,
                        value: editingValue.value.trim(),
                        price_delta: Number(editingValue.priceDelta) || 0,
                        stock: Number(editingValue.stock) || 0,
                        is_sold_out: editingValue.isSoldOut,
                        is_hidden: editingValue.isHidden,
                      }
                    : v
                ),
              }
            : g
        )
      );
      setEditingValueId(null);
    });
  };

  // ── 옵션 값 삭제 ────────────────────────────────
  const handleDeleteValue = (valueId: number, groupId: number) => {
    if (!window.confirm("이 옵션 값을 삭제할까요?")) return;
    const fd = new FormData();
    fd.append("id", String(valueId));
    fd.append("product_id", String(productId));

    startTransition(async () => {
      await deleteOptionValue(fd);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, option_values: g.option_values.filter((v) => v.id !== valueId) }
            : g
        )
      );
    });
  };

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          아직 등록된 옵션이 없습니다. 아래에서 옵션 그룹(예: 색상, 사이즈)을 추가하세요.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          {/* 그룹 헤더 */}
          <div className="mb-3 flex items-center gap-2">
            {editingGroupId === group.id ? (
              <>
                <input
                  className={`${inputCls} flex-1`}
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUpdateGroup(group.id); }}
                />
                <button type="button" className={btnPrimary} disabled={isPending} onClick={() => handleUpdateGroup(group.id)}>저장</button>
                <button type="button" className={btnGhost} onClick={() => setEditingGroupId(null)}>취소</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-semibold text-gray-900">{group.name}</span>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => { setEditingGroupId(group.id); setEditingGroupName(group.name); }}
                >
                  이름 수정
                </button>
                <button type="button" className={btnDanger} disabled={isPending} onClick={() => handleDeleteGroup(group.id)}>삭제</button>
              </>
            )}
          </div>

          {/* 옵션 값 목록 */}
          <div className="mb-3 space-y-1.5">
            {group.option_values.map((ov) => (
              <div key={ov.id} className="rounded-lg border border-gray-200 bg-white p-2.5">
                {editingValueId === ov.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-0.5 block text-xs text-gray-500">옵션 값</label>
                        <input className={inputCls} value={editingValue.value} onChange={(e) => setEditingValue((p) => ({ ...p, value: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs text-gray-500">추가금액 (원)</label>
                        <input type="number" className={inputCls} value={editingValue.priceDelta} onChange={(e) => setEditingValue((p) => ({ ...p, priceDelta: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs text-gray-500">재고</label>
                        <input type="number" className={inputCls} value={editingValue.stock} onChange={(e) => setEditingValue((p) => ({ ...p, stock: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input type="checkbox" checked={editingValue.isSoldOut} onChange={(e) => setEditingValue((p) => ({ ...p, isSoldOut: e.target.checked }))} />
                        품절 처리
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <input type="checkbox" checked={editingValue.isHidden} onChange={(e) => setEditingValue((p) => ({ ...p, isHidden: e.target.checked }))} />
                        숨김 처리
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={btnPrimary} disabled={isPending} onClick={() => handleUpdateValue(ov.id, group.id)}>저장</button>
                      <button type="button" className={btnGhost} onClick={() => setEditingValueId(null)}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`flex-1 text-sm ${ov.is_sold_out || ov.is_hidden ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {ov.value}
                      {ov.price_delta !== 0 && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({ov.price_delta > 0 ? "+" : ""}{ov.price_delta.toLocaleString()}원)
                        </span>
                      )}
                    </span>
                    <div className="flex gap-1">
                      {ov.is_sold_out && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">품절</span>}
                      {ov.is_hidden && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">숨김</span>}
                    </div>
                    <span className="text-xs text-gray-400">재고 {ov.stock}</span>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setEditingValueId(ov.id);
                        setEditingValue({ value: ov.value, priceDelta: String(ov.price_delta), stock: String(ov.stock), isSoldOut: ov.is_sold_out, isHidden: ov.is_hidden });
                      }}
                    >
                      수정
                    </button>
                    <button type="button" className={btnDanger} disabled={isPending} onClick={() => handleDeleteValue(ov.id, group.id)}>삭제</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 새 옵션 값 추가 */}
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3">
            <p className="mb-2 text-xs font-medium text-gray-500">+ 옵션 값 추가</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">옵션 값 *</label>
                <input
                  className={inputCls}
                  placeholder="예: 레드"
                  value={getNewValue(group.id).value}
                  onChange={(e) => setNewValue(group.id, { value: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddValue(group.id); } }}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">추가금액 (원)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="0"
                  value={getNewValue(group.id).priceDelta}
                  onChange={(e) => setNewValue(group.id, { priceDelta: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">재고</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="0"
                  value={getNewValue(group.id).stock}
                  onChange={(e) => setNewValue(group.id, { stock: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-2 flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input type="checkbox" checked={getNewValue(group.id).isSoldOut} onChange={(e) => setNewValue(group.id, { isSoldOut: e.target.checked })} />
                품절
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-600">
                <input type="checkbox" checked={getNewValue(group.id).isHidden} onChange={(e) => setNewValue(group.id, { isHidden: e.target.checked })} />
                숨김
              </label>
            </div>
            <button type="button" className={btnPrimary} disabled={isPending || !getNewValue(group.id).value.trim()} onClick={() => handleAddValue(group.id)}>
              옵션 값 추가
            </button>
          </div>
        </div>
      ))}

      {/* 새 그룹 추가 */}
      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <p className="mb-2 text-xs font-medium text-gray-600">옵션 그룹 추가 (예: 색상, 사이즈)</p>
        <div className="flex gap-2">
          <input
            className={`${inputCls} flex-1`}
            placeholder="예: 색상"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddGroup(); } }}
          />
          <button type="button" className={btnPrimary} disabled={isPending || !newGroupName.trim()} onClick={handleAddGroup}>
            그룹 추가
          </button>
        </div>
      </div>
    </div>
  );
}
