import Link from 'next/link';
import ProductQuickList from '@/src/components/admin/products/ProductQuickList';
import { getSetProducts } from '@/src/server/admin-product-groups';

export default async function AdminSetProductsPage() {
  const { setCategory, setCategories, products } = await getSetProducts();

  // 각 상품에 카테고리명 붙이기
  const categoryNameMap = new Map(setCategories.map((c) => [c.id, c.name]));
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
          <p className="mt-1 text-sm text-gray-500">
            <strong>세트상품</strong> 카테고리(및 그 하위 카테고리)에 속한 상품만
            모아서 빠르게 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          + 상품 등록
        </Link>
      </div>

      {!setCategory ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">
            아직 &ldquo;세트상품&rdquo; 카테고리가 등록되지 않았습니다.
          </p>
          <p className="mt-1">
            카테고리 관리에서 <strong>slug = sets</strong> 로 카테고리를 먼저
            만들어 주세요. (상단 메뉴의 &ldquo;세트상품&rdquo; 링크도 이 슬러그를
            기준으로 연결됩니다.)
          </p>
          <div className="mt-3">
            <Link
              href="/admin/categories"
              className="rounded-xl border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-800"
            >
              카테고리 관리로 이동 →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900">
            <p>
              현재 세트 카테고리:{' '}
              <strong>
                {setCategory.name} (/{setCategory.slug})
              </strong>
              {setCategories.length > 1
                ? ` · 하위 ${setCategories.length - 1}개 카테고리 포함`
                : ''}
            </p>
          </div>

          <ProductQuickList
            products={productsWithMeta}
            subtitle="세트 카테고리 소속"
            emptyMessage="세트 카테고리에 속한 상품이 아직 없습니다. 상품 등록 시 카테고리를 '세트상품'으로 지정해 주세요."
          />
        </>
      )}
    </div>
  );
}
