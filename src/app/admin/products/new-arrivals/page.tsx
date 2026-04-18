import NewArrivalsPanel from '@/src/components/admin/products/NewArrivalsPanel';
import { getAllProductsWithCategoryName } from '@/src/server/admin-product-groups';

export default async function AdminNewArrivalsPage() {
  const products = await getAllProductsWithCategoryName();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">신상품 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          체크한 상품만 쇼핑몰에서 <strong>신상품 배지</strong>로 노출됩니다.
          체크 해제된 상품은 배지가 사라집니다.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-blue-900">
        <ul className="list-disc space-y-0.5 pl-5">
          <li>
            체크한 상품의 <code>is_new</code> 값이 <strong>true</strong> 로
            설정됩니다.
          </li>
          <li>한 번에 여러 개를 체크/해제한 다음 하단의 저장 버튼을 눌러 주세요.</li>
          <li>
            쇼핑몰의 <strong>&ldquo;신상품순&rdquo;</strong> 정렬은 이 배지를
            기준으로 앞쪽에 배치됩니다.
          </li>
        </ul>
      </div>

      <NewArrivalsPanel products={products} />
    </div>
  );
}
