import CatalogTreePanel from '@/src/components/admin/catalog/CatalogTreePanel';
import { getCatalogTree } from '@/src/server/admin-catalog';

export default async function AdminCatalogPage() {
  const tree = await getCatalogTree();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">카탈로그 관리 (통합)</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          카테고리는 <strong>폴더</strong>, 상품은 <strong>파일</strong>처럼 보입니다.
          각 카테고리를 펼치면 하위 카테고리와 그 안의 상품이 함께 보이고,
          이름·가격·카테고리 변경은 바로 이 페이지에서 할 수 있어요.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900">
        <p className="mb-1 font-semibold">빠른 편집 가이드</p>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>
            카테고리/상품 이름을 <strong>클릭</strong>하면 모달로 바로 수정할 수
            있습니다.
          </li>
          <li>
            상품 옆 <strong>카테고리 드롭다운</strong>은 선택 즉시 저장됩니다
            (별도 저장 버튼 없음).
          </li>
          <li>
            상품 <strong>이름/가격</strong>은 &quot;이름/가격&quot; 버튼으로 빠르게
            수정하고, 상세 설정은 <strong>상세</strong> 버튼으로 들어가세요.
          </li>
          <li>
            상위 카테고리 변경이나 slug 대규모 개편은{' '}
            <a
              href="/admin/categories"
              className="font-semibold underline hover:text-blue-700"
            >
              카테고리 전용 관리 페이지
            </a>
            에서 진행하세요.
          </li>
        </ul>
      </div>

      <CatalogTreePanel tree={tree} />
    </div>
  );
}
