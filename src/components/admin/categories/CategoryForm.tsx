import type { AdminCategory } from '@/src/server/admin-categories';

type Props = {
  categories: AdminCategory[];
  defaultValue?: AdminCategory;
  action: (formData: FormData) => Promise<void>;
};

export default function CategoryForm({
  categories,
  defaultValue,
  action,
}: Props) {
  const parentOptions = categories.filter((category) => category.level === 1);

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-white p-5">
      {defaultValue ? (
        <input type="hidden" name="id" value={defaultValue.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">카테고리명</label>
          <input
            type="text"
            name="name"
            defaultValue={defaultValue?.name ?? ''}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="예: 유아체육"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">슬러그</label>
          <input
            type="text"
            name="slug"
            defaultValue={defaultValue?.slug ?? ''}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="예: kids-sports"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            상위 카테고리
          </label>
          <select
            name="parent_id"
            defaultValue={defaultValue?.parent_id?.toString() ?? ''}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="">없음(대분류)</option>
            {parentOptions
              .filter((category) => category.id !== defaultValue?.id)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">정렬순서</label>
          <input
            type="number"
            name="sort_order"
            defaultValue={defaultValue?.sort_order ?? 0}
            className="w-full rounded-xl border px-3 py-2"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValue ? defaultValue.is_active : true}
        />
        사용하기
      </label>

      <button
        type="submit"
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
      >
        {defaultValue ? '카테고리 수정' : '카테고리 등록'}
      </button>
    </form>
  );
}
