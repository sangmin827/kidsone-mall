import { notFound } from "next/navigation";
import { getAdminOrderById, updateOrderStatus } from "@/src/server/orders";

const STATUS_LABEL: Record<string, string> = {
  pending: "입금대기",
  paid: "결제완료",
  preparing: "상품준비중",
  shipping: "배송중",
  delivered: "배송완료",
  cancelled: "주문취소",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const orderId = Number(id);

  if (!orderId) {
    notFound();
  }

  const order = await getAdminOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">주문 상세</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">기본 정보</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">주문번호:</span>{" "}
                {order.order_number}
              </p>
              <p>
                <span className="font-semibold text-gray-900">주문일:</span>{" "}
                {new Date(order.created_at).toLocaleString("ko-KR")}
              </p>
              <p>
                <span className="font-semibold text-gray-900">결제수단:</span>{" "}
                {order.payment_method}
              </p>
              <p>
                <span className="font-semibold text-gray-900">현재 상태:</span>{" "}
                {STATUS_LABEL[order.status] ?? order.status}
              </p>
              <p>
                <span className="font-semibold text-gray-900">입금자명:</span>{" "}
                {order.depositor_name ?? "-"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">주문자 정보</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">이름:</span>{" "}
                {order.orderer_name ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">연락처:</span>{" "}
                {order.orderer_phone ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">회원 ID:</span>{" "}
                {order.user_id}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">배송 정보</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">수령인:</span>{" "}
                {order.recipient_name}
              </p>
              <p>
                <span className="font-semibold text-gray-900">연락처:</span>{" "}
                {order.recipient_phone}
              </p>
              <p>
                <span className="font-semibold text-gray-900">우편번호:</span>{" "}
                {order.zip_code ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">기본주소:</span>{" "}
                {order.address}
              </p>
              <p>
                <span className="font-semibold text-gray-900">상세주소:</span>{" "}
                {order.detail_address ?? "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">요청사항:</span>{" "}
                {order.request_message ?? "-"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">주문 상품</h2>
            <div className="space-y-3">
              {order.order_items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {index + 1}. {item.product_name_snapshot}
                    </p>
                    <p className="mt-1 text-gray-500">
                      상품 ID: {item.product_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{item.price_snapshot.toLocaleString()}원</p>
                    <p>{item.quantity}개</p>
                    <p className="font-semibold">
                      {(item.price_snapshot * item.quantity).toLocaleString()}원
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border bg-white p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 text-lg font-bold">주문 관리</h2>

          <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
            총 주문금액:{" "}
            <span className="font-bold">
              {order.total_amount.toLocaleString()}원
            </span>
          </div>

          <form action={updateOrderStatus} className="space-y-3">
            <input type="hidden" name="orderId" value={order.id} />
            <select
              name="status"
              defaultValue={order.status}
              className="w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="pending">입금대기</option>
              <option value="paid">결제완료</option>
              <option value="preparing">상품준비중</option>
              <option value="shipping">배송중</option>
              <option value="delivered">배송완료</option>
              <option value="cancelled">주문취소</option>
            </select>

            <button
              type="submit"
              className="w-full rounded-xl bg-black px-4 py-3 text-sm text-white"
            >
              상태 변경 저장
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
