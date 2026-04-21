import ProductForm from '@/src/components/admin/products/ProductForm';
import { getAdminCategories } from '@/src/server/admin-categories';
import { createProduct } from '@/src/server/admin-product-actions';

export default async function AdminNewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">상품 등록</h1>
        <p className="text-sm text-[#6b7280]">
          새 상품을 등록합니다. 이미지는 저장 후 상세 편집에서 추가할 수 있습니다.
        </p>
      </div>

      <ProductForm categories={categories} action={createProduct} />
    </div>
  );
}
