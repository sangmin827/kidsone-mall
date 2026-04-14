import { notFound } from 'next/navigation';
import ProductForm from '@/src/components/admin/products/ProductForm';
import {
  getAdminProductById,
  updateProduct,
} from '@/src/server/admin-products';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params;
  const productId = Number(id);

  if (!productId) {
    notFound();
  }

  const product = await getAdminProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">상품 수정</h1>
        <p className="text-sm text-gray-500">상품 정보를 수정합니다.</p>
      </div>

      <ProductForm defaultValue={product} action={updateProduct} />
    </div>
  );
}
