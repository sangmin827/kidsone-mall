import type { AdminCategory } from '@/src/server/admin-categories';
import { deleteCategory } from '@/src/server/admin-categories';

type Props = {
  categories: AdminCategory[];
};

export default function CategoryTable({ categories }: Props) {
  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="px-4 py-3">번호</th>
            <th className="px-4 py-3">이름</th>
            <th className="px-4 py-3">슬러그</th>
            <th className="px-4 py-3">레벨</th>
            <th className="px-4 py-3">상위 카테고리</th>
            <th className="px-4 py-3">정렬</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">삭제</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                등록된 카테고리가 없습니다.
              </td>
            </tr>
          ) : (
            categories.map((category, index) => (
              <tr key={category.id} className="border-b">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{category.name}</td>
                <td className="px-4 py-3">{category.slug}</td>
                <td className="px-4 py-3">{category.level}</td>
                <td className="px-4 py-3">
                  {category.parent_id
                    ? (categoryMap.get(category.parent_id) ?? '-')
                    : '-'}
                </td>
                <td className="px-4 py-3">{category.sort_order}</td>
                <td className="px-4 py-3">
                  {category.is_active ? '사용' : '숨김'}
                </td>
                <td className="px-4 py-3">
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button
                      type="submit"
                      className="rounded-lg border px-3 py-1 text-xs"
                    >
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
