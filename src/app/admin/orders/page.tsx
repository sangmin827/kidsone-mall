import Link from "next/link";
import { getAdminOrders } from "@/src/server/orders";

const STATUS_LABEL: Record<string, string> = {
  pending: "입금대기",
  paid: "결제완료",
  preparing: "상품준비중",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "주문취소",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">관리자 주문관리</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
          주문이 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="grid grid-cols-[80px_1.4fr_1fr_140px_160px] gap-4 border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            <div>번호</div>
            <div>주문정보</div>
            <div>주문자/수령인</div>
            <div>상태</div>
            <div>금액</div>
          </div>

          <div className="divide-y">
            {orders.map((order, index) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="grid grid-cols-[80px_1.4fr_1fr_140px_160px] gap-4 px-4 py-4 text-sm hover:bg-gray-50"
              >
                <div className="font-semibold text-gray-900">
                  {orders.length - index}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {order.order_number}
                  </p>
                  <p className="mt-1 text-gray-500">
                    {new Date(order.created_at).toLocaleString("ko-KR")}
                  </p>
                  <p className="mt-1 truncate text-gray-500">
                    상품 {order.order_items.length}건
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-gray-900">
                    주문자: {order.orderer_name ?? "-"}
                  </p>
                  <p className="mt-1 truncate text-gray-500">
                    수령인: {order.recipient_name}
                  </p>
                </div>

                <div className="font-medium">
                  {STATUS_LABEL[order.status] ?? order.status}
                </div>

                <div className="font-semibold text-gray-900">
                  {order.total_amount.toLocaleString()}원
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
