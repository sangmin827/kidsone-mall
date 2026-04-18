import Top100Panel from '@/src/components/admin/products/Top100Panel';
import { getAllProductsWithCategoryName } from '@/src/server/admin-product-groups';

export default async function AdminTop10Page() {
  const products = await getAllProductsWithCategoryName();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Top 10 · 100 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          마우스로 드래그해서 1~100위까지 순위를 지정합니다. 저장하면{' '}
          <strong>1~10위</strong>는 홈화면과 Top 10 페이지에,{' '}
          <strong>11~100위</strong>는 Top 10 페이지에만 노출됩니다.
        </p>
      </div>

      <Top100Panel products={products} />
    </div>
  );
}
