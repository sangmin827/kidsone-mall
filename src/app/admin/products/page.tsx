import Link from 'next/link';
import ProductTable from '@/src/components/admin/products/ProductTable';
import { getAdminProducts } from '@/src/server/admin-products';

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">상품 관리</h1>
          <p className="text-sm text-gray-500">
            상품 목록을 조회하고 수정할 수 있습니다.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          상품 등록
        </Link>
      </div>

      <ProductTable products={products} />
    </div>
  );
}
