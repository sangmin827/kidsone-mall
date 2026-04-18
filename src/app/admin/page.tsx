import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">관리자 페이지</h1>
        <p className="text-sm text-gray-500">
          상품, 카테고리, 주문 등을 관리하는 관리자 화면입니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/catalog"
          className="rounded-2xl border-2 border-black bg-white p-6 shadow-sm transition hover:shadow md:col-span-2"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">카탈로그 관리 (통합)</h2>
            <span className="rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
              추천
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            카테고리(폴더) + 상품(파일)을 한 화면에서 트리로 보고, 이름·가격·카테고리를
            바로 수정하세요.
          </p>
        </Link>

        <Link
          href="/admin/products/sets"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">세트 상품 관리</h2>
          <p className="mt-2 text-sm text-gray-500">
            세트 카테고리에 속한 상품만 모아서 관리합니다.
          </p>
        </Link>

        <Link
          href="/admin/products/new-arrivals"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">신상품 관리</h2>
          <p className="mt-2 text-sm text-gray-500">
            체크박스로 신상품 노출 여부를 한번에 설정합니다.
          </p>
        </Link>

        <Link
          href="/admin/products/top10"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">Top 10 · 100 관리</h2>
          <p className="mt-2 text-sm text-gray-500">
            드래그로 1~100위 순위를 지정합니다. 1~10위는 홈화면에도 노출.
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">주문내역 관리</h2>
          <p className="mt-2 text-sm text-gray-500">
            주문내역 확인 및 주문상태 변경이 가능합니다.
          </p>
        </Link>

        <Link
          href="/admin/members"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">회원 관리</h2>
          <p className="mt-2 text-sm text-gray-500">
            회원들의 상태 관리 및 메모를 남길수 있습니다.
          </p>
        </Link>

        <Link
          href="/admin/activity-logs"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">활동 로그</h2>
          <p className="mt-2 text-sm text-gray-500">
            상품/카테고리/주문/회원 관리 작업 내역을 시간순으로 확인합니다.
          </p>
        </Link>

        <Link
          href="/admin/purchase-requests"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">구매 희망 요청</h2>
          <p className="mt-2 text-sm text-gray-500">
            품절 상품에 대해 고객이 남긴 재입고 안내 신청 내역을 확인합니다.
          </p>
        </Link>
      </div>
    </div>
  );
}
