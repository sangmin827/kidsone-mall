import Link from 'next/link';
import ProductQuickList from '@/src/components/admin/products/ProductQuickList';
import { getSetProducts } from '@/src/server/admin-product-groups';

export default async function AdminSetProductsPage() {
  const { products, categories } = await getSetProducts();

  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
  const productsWithMeta = products.map((p) => ({
    ...p,
    category_name:
      p.category_id !== null ? (categoryNameMap.get(p.category_id) ?? null) : null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">세트 상품 관리</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            상품 등록·수정 시 <strong>&quot;세트상품으로 등록&quot;</strong> 체크 여부로 관리됩니다.
            세트 상품은 전체상품 목록에서 제외되고 <strong>/sets</strong> 전용 페이지에 노출됩니다.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-[#5332C9] px-4 py-2 text-sm font-medium text-white hover:bg-[#4427b0] transition-colors"
        >
          + 상품 등록
        </Link>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900">
        <p>
          세트 상품으로 지정하려면 상품 등록/수정 페이지의 <strong>&quot;노출·배지&quot;</strong> 섹션에서{' '}
          <strong>&quot;세트상품으로 등록&quot;</strong> 을 체크하세요.
        </p>
      </div>

      <ProductQuickList
        products={productsWithMeta}
        subtitle="is_set = true 상품"
        emptyMessage="아직 등록된 세트 상품이 없습니다. 상품 등록/수정에서 '세트상품으로 등록'을 체크하면 이 목록에 표시됩니다."
      />
    </div>
  );
}
