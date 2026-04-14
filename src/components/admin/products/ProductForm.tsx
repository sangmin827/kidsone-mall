import type { AdminProduct } from '@/src/server/admin-products';

type Props = {
  defaultValue?: AdminProduct | null;
  action: (formData: FormData) => Promise<void>;
};

export default function ProductForm({ defaultValue, action }: Props) {
  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-white p-5">
      {defaultValue ? (
        <input type="hidden" name="id" value={defaultValue.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">상품명</label>
          <input
            type="text"
            name="name"
            defaultValue={defaultValue?.name ?? ''}
            className="w-full rounded-xl border px-3 py-2"
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
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">가격</label>
          <input
            type="number"
            name="price"
            defaultValue={defaultValue?.price ?? 0}
            className="w-full rounded-xl border px-3 py-2"
            min={0}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">재고</label>
          <input
            type="number"
            name="stock"
            defaultValue={defaultValue?.stock ?? 0}
            className="w-full rounded-xl border px-3 py-2"
            min={0}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={defaultValue ? defaultValue.is_active : true}
        />
        판매중으로 표시
      </label>

      <button
        type="submit"
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
      >
        {defaultValue ? '상품 수정' : '상품 등록'}
      </button>
    </form>
  );
}
