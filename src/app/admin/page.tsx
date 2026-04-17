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
          href="/admin/products"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">상품 관리</h2>
          <p className="mt-2 text-sm text-gray-500">
            상품 목록 조회, 등록, 수정, 삭제
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow"
        >
          <h2 className="text-lg font-semibold">카테고리 관리</h2>
          <p className="mt-2 text-sm text-gray-500">
            대분류 중심으로 관리하고, 나중에 중분류/소분류로 확장
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
