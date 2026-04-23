import { notFound } from 'next/navigation';
import ProductForm from '@/src/components/admin/products/ProductForm';
import { getAdminCategories } from '@/src/server/admin-categories';
import { getAdminProductById } from '@/src/server/admin-products';
import { updateProduct } from '@/src/server/admin-product-actions';
import { getProductOptionGroups } from '@/src/server/admin-option-actions';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductDetailPage({ params }: Props) {
  const { id } = await params;
  const productId = Number(id);

  if (!productId) {
    notFound();
  }

  const [product, categories, optionGroups] = await Promise.all([
    getAdminProductById(productId),
    getAdminCategories(),
    getProductOptionGroups(productId).catch(() => []),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">상품 수정</h1>
        <p className="text-sm text-[#6b7280]">
          상품 정보·이미지·옵션을 수정합니다. 변경 내용은 즉시 쇼핑몰에 반영됩니다.
        </p>
      </div>

      <ProductForm
        defaultValue={product}
        categories={categories}
        action={updateProduct}
        initialOptionGroups={optionGroups}
      />
    </div>
  );
}
