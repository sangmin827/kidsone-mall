import CategoryForm from '@/src/components/admin/categories/CategoryForm';
import CategoryTable from '@/src/components/admin/categories/CategoryTable';
import {
  createCategory,
  getAdminCategories,
} from '@/src/server/admin-categories';

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <p className="text-sm text-gray-500">
          지금은 대분류 중심으로 사용하고, 나중에 중분류/소분류로 확장할 수
          있습니다.
        </p>
      </div>

      <CategoryForm categories={categories} action={createCategory} />

      <CategoryTable categories={categories} />
    </div>
  );
}
