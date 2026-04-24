import ProductForm from "@/src/components/admin/products/ProductForm";
import { getAdminCategories } from "@/src/server/admin-categories";
import { createProduct } from "@/src/server/admin-product-actions";

type PageProps = {
  searchParams: Promise<{ category_id?: string }>;
};

export default async function AdminNewProductPage({ searchParams }: PageProps) {
  const [categories, params] = await Promise.all([
    getAdminCategories(),
    searchParams,
  ]);

  const defaultCategoryId = params.category_id
    ? Number(params.category_id)
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">상품 등록</h1>
        <p className="text-sm text-[#6b7280]">새 상품을 등록합니다.</p>
      </div>

      <ProductForm
        categories={categories}
        action={createProduct}
        defaultCategoryId={defaultCategoryId}
      />
    </div>
  );
}
