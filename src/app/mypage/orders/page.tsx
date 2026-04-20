import Link from "next/link";
import OrderList from "@/src/components/mypage/OrderList";
import { getMyOrders } from "@/src/server/orders";
import type { MyOrder } from "@/src/server/orders";

export default async function MyPageOrdersPage() {
  let orders: MyOrder[] = [];
  let errorMessage = "";

  try {
    orders = await getMyOrders();
  } catch (e) {
    errorMessage =
      e instanceof Error ? e.message : "주문내역을 불러오지 못했습니다.";
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* 페이지 헤더 */}
      <div className="border-b border-[#E8E6E1] bg-white">
        <div className="section-inner py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="section-title">주문내역</h1>
              {orders.length > 0 && (
                <p className="mt-1 text-sm text-[#6b7280]">
                  총{" "}
                  <span className="font-semibold text-[#222222]">
                    {orders.length}건
                  </span>
                  의 주문
                </p>
              )}
            </div>
            <Link
              href="/mypage"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              마이페이지
            </Link>
          </div>
        </div>
      </div>

      <div className="section-inner py-6 sm:py-8">
        {/* 에러 상태 */}
        {errorMessage ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
              ⚠️
            </div>
            <div>
              <p className="text-sm font-bold text-red-700">
                주문내역을 불러오지 못했습니다
              </p>
              <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
            </div>
            <a
              href="/mypage/orders"
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
            >
              다시 시도
            </a>
          </div>
        ) : (
          <OrderList orders={orders} />
        )}
      </div>
    </main>
  );
}
