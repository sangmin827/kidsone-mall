import CategoryAdminPanel from '@/src/components/admin/categories/CategoryAdminPanel';
import { getAdminCategoriesWithCounts } from '@/src/server/admin-categories';

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategoriesWithCounts();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">카테고리 관리</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          상위 카테고리(대분류) 아래에 하위 카테고리(중분류)를 붙여서 2단계
          구조로 관리합니다. 각 카드에서 직접 수정·순서변경·노출 토글·삭제가
          가능합니다.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900">
        <p className="mb-1 font-semibold">사용 가이드</p>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>
            <strong>상위 카테고리</strong>는 쇼핑몰 상단 메뉴에 노출되는 대분류입니다.
          </li>
          <li>
            <strong>하위 카테고리</strong>는 상위에 딸려 있는 분류로, 상품 등록 시
            선택지가 됩니다.
          </li>
          <li>
            카테고리에 상품이 연결돼 있으면 삭제할 수 없어요. 대신 &quot;숨기기&quot;로
            전환하면 쇼핑몰에서 보이지 않게 됩니다.
          </li>
          <li>순서 이동(↑↓)은 같은 레벨 · 같은 상위 안에서만 적용됩니다.</li>
        </ul>
      </div>

      <CategoryAdminPanel categories={categories} />
    </div>
  );
}
