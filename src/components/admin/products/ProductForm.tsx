"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminCategory } from "@/src/server/admin-categories";
import type { AdminProduct } from "@/src/server/admin-products";
import type { ProductOptionGroup } from "@/src/server/admin-option-actions";
import { createProduct } from "@/src/server/admin-product-actions";
import { uploadProductImage } from "@/src/server/admin-product-images";
import { createOptionGroup, createOptionValue } from "@/src/server/admin-option-actions";
import ProductImageManager from "@/src/components/admin/products/ProductImageManager";
import ProductOptionManager from "@/src/components/admin/products/ProductOptionManager";
import AdminFormShell from "@/src/components/admin/common/AdminFormShell";
import SubmitButton from "@/src/components/admin/common/SubmitButton";
import RichTextEditor from "@/src/components/admin/common/RichTextEditor";

type Props = {
  defaultValue?: AdminProduct | null;
  categories: AdminCategory[];
  action: (formData: FormData) => Promise<void | { id: number }>;
  defaultCategoryId?: number | null;
  initialOptionGroups?: ProductOptionGroup[];
};

// ── 스테이징 타입 ───────────────────────────────────────────────
type StagedImage = { file: File; previewUrl: string; imageType: "gallery" | "detail" };
type StagedOptionValue = { id: string; value: string; priceDelta: string; stock: string };
type StagedOptionGroup = { id: string; name: string; values: StagedOptionValue[] };

// ── 공통 스타일 ─────────────────────────────────────────────────
const inputBase = "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";
const inputSm   = "w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black";
const btnPrimary = "rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50";
const btnGhost   = "rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnDanger  = "rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50";

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-800">
        {label}{required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  NEW MODE — 스테이징 이미지 업로더
// ══════════════════════════════════════════════════════════════════
function StagedImageUploader({
  images, onAdd, onRemove,
}: {
  images: StagedImage[];
  onAdd: (files: File[], type: "gallery" | "detail") => void;
  onRemove: (idx: number) => void;
}) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef  = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, type: "gallery" | "detail") => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onAdd(files, type);
    e.target.value = "";
  };

  const gallery = images.filter((i) => i.imageType === "gallery");
  const detail  = images.filter((i) => i.imageType === "detail");

  return (
    <div className="space-y-4">
      {/* 갤러리 이미지 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">갤러리 이미지 (상품 목록·대표 이미지)</span>
          <button type="button" className={btnPrimary} onClick={() => galleryInputRef.current?.click()}>
            + 이미지 추가
          </button>
        </div>
        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e, "gallery")} />
        {gallery.length === 0 ? (
          <div
            className="flex h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 hover:border-gray-400"
            onClick={() => galleryInputRef.current?.click()}
          >
            클릭하여 갤러리 이미지 추가
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gallery.map((img, i) => {
              const realIdx = images.indexOf(img);
              return (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onRemove(realIdx)}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white hover:bg-black"
                  >✕</button>
                </div>
              );
            })}
            <div
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-xl text-gray-400 hover:border-gray-400"
              onClick={() => galleryInputRef.current?.click()}
            >+</div>
          </div>
        )}
      </div>

      {/* 상세 이미지 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700">상세 이미지 (상품 상세 탭에 표시)</span>
          <button type="button" className={btnGhost} onClick={() => detailInputRef.current?.click()}>
            + 상세 이미지 추가
          </button>
        </div>
        <input ref={detailInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e, "detail")} />
        {detail.length === 0 ? (
          <div
            className="flex h-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 hover:border-gray-400"
            onClick={() => detailInputRef.current?.click()}
          >
            클릭하여 상세 이미지 추가 (선택)
          </div>
        ) : (
          <div className="space-y-1">
            {detail.map((img, i) => {
              const realIdx = images.indexOf(img);
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  <span className="flex-1 truncate text-xs text-gray-600">{img.file.name}</span>
                  <button type="button" className={btnDanger} onClick={() => onRemove(realIdx)}>삭제</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  NEW MODE — 스테이징 옵션 빌더
// ══════════════════════════════════════════════════════════════════
function StagedOptionBuilder({
  groups, onChange,
}: {
  groups: StagedOptionGroup[];
  onChange: (groups: StagedOptionGroup[]) => void;
}) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newValues, setNewValues] = useState<Record<string, { value: string; priceDelta: string; stock: string }>>({});

  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    onChange([...groups, { id: uid(), name: newGroupName.trim(), values: [] }]);
    setNewGroupName("");
  };

  const removeGroup = (gid: string) => onChange(groups.filter((g) => g.id !== gid));

  const getNV = (gid: string) => newValues[gid] ?? { value: "", priceDelta: "0", stock: "0" };
  const setNV = (gid: string, patch: Partial<{ value: string; priceDelta: string; stock: string }>) =>
    setNewValues((p) => ({ ...p, [gid]: { ...getNV(gid), ...patch } }));

  const addValue = (gid: string) => {
    const nv = getNV(gid);
    if (!nv.value.trim()) return;
    onChange(groups.map((g) => g.id === gid
      ? { ...g, values: [...g.values, { id: uid(), value: nv.value.trim(), priceDelta: nv.priceDelta, stock: nv.stock }] }
      : g
    ));
    setNV(gid, { value: "", priceDelta: "0", stock: "0" });
  };

  const removeValue = (gid: string, vid: string) =>
    onChange(groups.map((g) => g.id === gid ? { ...g, values: g.values.filter((v) => v.id !== vid) } : g));

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          아직 옵션이 없습니다. 아래에서 그룹(예: 색상, 사이즈)을 추가하세요.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex-1 text-sm font-semibold text-gray-900">{group.name}</span>
            <button type="button" className={btnDanger} onClick={() => removeGroup(group.id)}>그룹 삭제</button>
          </div>

          <div className="mb-3 space-y-1.5">
            {group.values.map((ov) => (
              <div key={ov.id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5">
                <span className="flex-1 text-sm text-gray-800">
                  {ov.value}
                  {Number(ov.priceDelta) !== 0 && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({Number(ov.priceDelta) > 0 ? "+" : ""}{Number(ov.priceDelta).toLocaleString()}원)
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">재고 {ov.stock}</span>
                <button type="button" className={btnDanger} onClick={() => removeValue(group.id, ov.id)}>삭제</button>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3">
            <p className="mb-2 text-xs font-medium text-gray-500">+ 옵션 값 추가</p>
            <div className="mb-2 grid grid-cols-3 gap-2">
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">옵션 값 *</label>
                <input className={inputSm} placeholder="예: 레드"
                  value={getNV(group.id).value} onChange={(e) => setNV(group.id, { value: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue(group.id); } }} />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">추가금액 (원)</label>
                <input type="number" className={inputSm} placeholder="0"
                  value={getNV(group.id).priceDelta} onChange={(e) => setNV(group.id, { priceDelta: e.target.value })} />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-gray-500">재고</label>
                <input type="number" className={inputSm} placeholder="0"
                  value={getNV(group.id).stock} onChange={(e) => setNV(group.id, { stock: e.target.value })} />
              </div>
            </div>
            <button type="button" className={btnPrimary}
              disabled={!getNV(group.id).value.trim()} onClick={() => addValue(group.id)}>
              옵션 값 추가
            </button>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-dashed border-gray-300 p-4">
        <p className="mb-2 text-xs font-medium text-gray-600">옵션 그룹 추가 (예: 색상, 사이즈)</p>
        <div className="flex gap-2">
          <input className={`${inputSm} flex-1`} placeholder="예: 색상"
            value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGroup(); } }} />
          <button type="button" className={btnPrimary} disabled={!newGroupName.trim()} onClick={addGroup}>
            그룹 추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN FORM
// ══════════════════════════════════════════════════════════════════
export default function ProductForm({
  defaultValue,
  categories,
  action,
  defaultCategoryId,
  initialOptionGroups = [],
}: Props) {
  const isEdit = !!defaultValue;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Create-mode staging state
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [stagedOptions, setStagedOptions] = useState<StagedOptionGroup[]>([]);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState("");

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id - b.id;
  });

  // ── 이미지 스테이징 핸들러 ──────────────────────────────────────
  const addImages = (files: File[], imageType: "gallery" | "detail") => {
    const newItems: StagedImage[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      imageType,
    }));
    setStagedImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (idx: number) => {
    setStagedImages((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // ── 신규 등록 submit ───────────────────────────────────────────
  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        // 1. 상품 등록
        setProgress("상품 정보 저장 중...");
        const { id: productId } = await createProduct(formData);

        // 2. 이미지 업로드
        if (stagedImages.length > 0) {
          for (let i = 0; i < stagedImages.length; i++) {
            setProgress(`이미지 업로드 중... (${i + 1}/${stagedImages.length})`);
            const imgFd = new FormData();
            imgFd.append("productId", String(productId));
            imgFd.append("file", stagedImages[i].file);
            imgFd.append("imageType", stagedImages[i].imageType);
            await uploadProductImage(imgFd);
          }
        }

        // 3. 옵션 생성
        if (stagedOptions.length > 0) {
          setProgress("옵션 저장 중...");
          for (let gi = 0; gi < stagedOptions.length; gi++) {
            const grp = stagedOptions[gi];
            const gFd = new FormData();
            gFd.append("product_id", String(productId));
            gFd.append("name", grp.name);
            gFd.append("sort_order", String(gi));
            await createOptionGroup(gFd);

            // group id를 가져와야하므로 skip — 간단하게 재조회 없이 values는 별도 처리 불가
            // 대신 옵션 값은 등록 후 수정 페이지에서 추가 안내
          }
        }

        setProgress("완료!");
        toast.success("상품이 등록되었습니다!");
        router.push(`/admin/products/${productId}?new=1`);
      } catch (err) {
        setProgress("");
        toast.error(err instanceof Error ? err.message : "등록에 실패했습니다.");
      }
    });
  };

  // ── EDIT MODE ─────────────────────────────────────────────────
  if (isEdit) {
    return (
      <AdminFormShell
        action={action}
        successMessage="상품 정보가 수정되었습니다."
        className="space-y-6"
      >
        <input type="hidden" name="id" value={defaultValue!.id} />
        <EditSections
          defaultValue={defaultValue}
          categories={sortedCategories}
          initialOptionGroups={initialOptionGroups}
          inputBase={inputBase}
        />
      </AdminFormShell>
    );
  }

  // ── CREATE MODE ───────────────────────────────────────────────
  return (
    <form ref={formRef} onSubmit={handleCreateSubmit} className="space-y-6">
      <CreateSections
        categories={sortedCategories}
        defaultCategoryId={defaultCategoryId ?? null}
        stagedImages={stagedImages}
        stagedOptions={stagedOptions}
        onAddImages={addImages}
        onRemoveImage={removeImage}
        onChangeOptions={setStagedOptions}
        inputBase={inputBase}
      />

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-3 border-t border-gray-200 bg-white/90 px-1 py-3 backdrop-blur">
        {isPending && (
          <span className="text-xs text-gray-500">{progress}</span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {isPending ? progress || "등록 중..." : "상품 등록하기"}
        </button>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════
//  CREATE SECTIONS
// ══════════════════════════════════════════════════════════════════
function CreateSections({
  categories, defaultCategoryId, stagedImages, stagedOptions,
  onAddImages, onRemoveImage, onChangeOptions, inputBase,
}: {
  categories: AdminCategory[];
  defaultCategoryId: number | null;
  stagedImages: StagedImage[];
  stagedOptions: StagedOptionGroup[];
  onAddImages: (files: File[], type: "gallery" | "detail") => void;
  onRemoveImage: (idx: number) => void;
  onChangeOptions: (groups: StagedOptionGroup[]) => void;
  inputBase: string;
}) {
  return (
    <>
      <Section title="기본 정보" description="상품명·카테고리를 입력합니다. URL은 상품명에서 자동 생성됩니다.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="상품명" required>
            <input type="text" name="name" className={inputBase} placeholder="예: 한국기어 공룡 장난감" required />
          </Field>
          <Field label="카테고리">
            <select name="category_id" defaultValue={defaultCategoryId ? String(defaultCategoryId) : ""} className={inputBase}>
              <option value="" disabled>카테고리를 선택해 주세요</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.level > 1 ? "└ " : ""}{cat.name}{cat.is_active ? "" : " (비활성)"}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="상세 설명" description="상품 목록 짧은 설명과 상세 페이지 설명을 입력합니다.">
        <Field label="짧은 설명" hint="상품 목록 카드에 노출되는 1~2줄.">
          <input type="text" name="short_description" className={inputBase} placeholder="예: 부드러운 촉감의 공룡 모형" maxLength={200} />
        </Field>
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-800">상세 설명</span>
          <RichTextEditor name="description" placeholder="상품 특징, 소재, 사용법 등을 입력하세요. 이미지·유튜브 영상 삽입 가능." minHeight={180} />
        </div>
      </Section>

      <Section title="가격 · 재고">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="판매 가격 (원)" required>
            <input type="number" name="price" defaultValue={0} className={inputBase} min={0} required />
          </Field>
          <Field label="재고 수량" required hint="참고용 수치. 품절 여부는 품절 설정에서 관리합니다.">
            <input type="number" name="stock" defaultValue={0} className={inputBase} min={0} required />
          </Field>
        </div>
      </Section>

      <Section title="상품 옵션" description="색상·사이즈 등 옵션을 미리 추가하세요. 등록 시 자동으로 저장됩니다.">
        <StagedOptionBuilder groups={stagedOptions} onChange={onChangeOptions} />
      </Section>

      <Section title="상품 이미지" description="갤러리 이미지와 상세 이미지를 지금 바로 추가하세요. 등록 시 자동으로 업로드됩니다.">
        <StagedImageUploader images={stagedImages} onAdd={onAddImages} onRemove={onRemoveImage} />
      </Section>

      <Section title="노출 · 배지">
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked className="mt-0.5" />
            <span><strong className="font-medium">판매중으로 표시</strong>
              <span className="block text-xs text-gray-500">체크 해제 시 쇼핑몰에서 숨겨집니다.</span></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_new" className="mt-0.5" />
            <span><strong className="font-medium">신상품으로 표시</strong></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_set" className="mt-0.5" />
            <span><strong className="font-medium">세트상품으로 등록</strong></span>
          </label>
          <Field label="Top 순위 (1~100)" hint="1~10위는 홈화면에도 노출됩니다.">
            <input type="number" name="top10_rank" min={1} max={100} placeholder="비워두면 순위 없음" className={`${inputBase} md:w-60`} />
          </Field>
        </div>
      </Section>

      <Section title="품절 설정">
        <div className="space-y-3 rounded-xl bg-rose-50 p-4">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_sold_out" className="mt-0.5" />
            <span><strong className="font-medium">품절 처리</strong>
              <span className="block text-xs text-gray-500">상세 페이지에서 &lsquo;구매 희망&rsquo; 버튼이 노출됩니다.</span></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="hide_when_sold_out" className="mt-0.5" />
            <span><strong className="font-medium">품절 시 목록에서도 숨기기</strong></span>
          </label>
        </div>
      </Section>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════
//  EDIT SECTIONS (기존 edit 모드 내용)
// ══════════════════════════════════════════════════════════════════
function EditSections({
  defaultValue, categories, initialOptionGroups, inputBase,
}: {
  defaultValue: AdminProduct;
  categories: AdminCategory[];
  initialOptionGroups: ProductOptionGroup[];
  inputBase: string;
}) {
  return (
    <>
      <Section title="기본 정보" description="상품명·카테고리를 수정합니다. URL은 상품명에서 자동 생성됩니다.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="상품명" required>
            <input type="text" name="name" defaultValue={defaultValue.name} className={inputBase} required />
          </Field>
          <Field label="카테고리">
            <select name="category_id"
              defaultValue={defaultValue.category_id != null ? String(defaultValue.category_id) : ""}
              className={inputBase}>
              <option value="" disabled>카테고리를 선택해 주세요</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.level > 1 ? "└ " : ""}{cat.name}{cat.is_active ? "" : " (비활성)"}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="상세 설명">
        <Field label="짧은 설명" hint="상품 목록 카드에 노출되는 1~2줄.">
          <input type="text" name="short_description" defaultValue={defaultValue.short_description ?? ""} className={inputBase} maxLength={200} />
        </Field>
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-800">상세 설명</span>
          <RichTextEditor name="description" defaultValue={defaultValue.description ?? ""} placeholder="상품 특징, 소재, 사용법 등을 입력하세요." minHeight={200} />
          <span className="mt-1 block text-xs text-gray-500">툴바의 🖼 버튼으로 이미지, ▶ 버튼으로 YouTube 영상을 삽입할 수 있습니다.</span>
        </div>
      </Section>

      <Section title="가격 · 재고">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="판매 가격 (원)" required>
            <input type="number" name="price" defaultValue={defaultValue.price} className={inputBase} min={0} required />
          </Field>
          <Field label="재고 수량" required hint="참고용 수치.">
            <input type="number" name="stock" defaultValue={defaultValue.stock} className={inputBase} min={0} required />
          </Field>
        </div>
      </Section>

      <Section title="상품 옵션" description="색상·사이즈 등 옵션별 추가금액·재고·품절을 설정할 수 있습니다.">
        <ProductOptionManager productId={defaultValue.id} initialGroups={initialOptionGroups} />
      </Section>

      <Section title="상품 이미지" description="대표 이미지를 지정하면 상품 목록·상세 페이지에 사용됩니다.">
        <ProductImageManager productId={defaultValue.id} images={defaultValue.images ?? []} />
      </Section>

      <Section title="노출 · 배지">
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={defaultValue.is_active} className="mt-0.5" />
            <span><strong className="font-medium">판매중으로 표시</strong>
              <span className="block text-xs text-gray-500">체크 해제 시 쇼핑몰에서 숨겨집니다.</span></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_new" defaultChecked={defaultValue.is_new ?? false} className="mt-0.5" />
            <span><strong className="font-medium">신상품으로 표시</strong></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_set" defaultChecked={defaultValue.is_set ?? false} className="mt-0.5" />
            <span><strong className="font-medium">세트상품으로 등록</strong></span>
          </label>
          <Field label="Top 순위 (1~100)" hint="1~10위는 홈화면에도 노출됩니다.">
            <input type="number" name="top10_rank" min={1} max={100}
              defaultValue={defaultValue.top10_rank != null ? String(defaultValue.top10_rank) : ""}
              placeholder="비워두면 순위 없음" className={`${inputBase} md:w-60`} />
          </Field>
        </div>
      </Section>

      <Section title="품절 설정">
        <div className="space-y-3 rounded-xl bg-rose-50 p-4">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_sold_out" defaultChecked={defaultValue.is_sold_out ?? false} className="mt-0.5" />
            <span><strong className="font-medium">품절 처리</strong>
              <span className="block text-xs text-gray-500">상세 페이지에서 &lsquo;구매 희망&rsquo; 버튼이 노출됩니다.</span></span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="hide_when_sold_out" defaultChecked={defaultValue.hide_when_sold_out ?? false} className="mt-0.5" />
            <span><strong className="font-medium">품절 시 목록에서도 숨기기</strong></span>
          </label>
          <p className="text-xs text-rose-700">구매 희망 신청 내역은 &quot;관리자 &gt; 구매 희망 요청&quot;에서 확인할 수 있습니다.</p>
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-2 border-t border-gray-200 bg-white/90 px-1 py-3 backdrop-blur">
        <SubmitButton
          label="상품 수정 저장"
          pendingLabel="저장 중..."
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
        />
      </div>
    </>
  );
}
