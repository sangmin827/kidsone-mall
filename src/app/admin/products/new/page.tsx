import ProductForm from '@/src/components/admin/products/ProductForm';
import { createProduct } from '@/src/server/admin-products';

export default function AdminNewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">상품 등록</h1>
        <p className="text-sm text-gray-500">새 상품을 등록합니다.</p>
      </div>

      <ProductForm action={createProduct} />
    </div>
  );
}
