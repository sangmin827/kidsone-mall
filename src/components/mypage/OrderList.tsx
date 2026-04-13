// components/mypage/OrderList.tsx
import type { MyOrder } from "@/src/server/orders";

type Props = {
  orders: MyOrder[];
};

function formatPrice(price: number) {
  return `${price.toLocaleString("ko-KR")}원`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ko-KR");
}

function getOrderStatusLabel(status: MyOrder["status"]) {
  switch (status) {
    case "pending":
      return "입금대기";
    case "paid":
      return "결제완료";
    case "preparing":
      return "상품준비중";
    case "shipping":
      return "배송중";
    case "delivered":
      return "배송완료";
    case "cancelled":
      return "주문취소";
    default:
      return status;
  }
}

export default function OrderList({ orders }: Props) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">주문내역</h2>
        <p className="mt-3 text-sm text-gray-500">아직 주문내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">주문내역</h2>

      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {formatDate(order.created_at)}
              </p>
              <p className="text-base font-semibold">
                주문번호: {order.order_number}
              </p>
            </div>

            <div className="text-sm font-medium text-gray-700">
              {getOrderStatusLabel(order.status)}
            </div>
          </div>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">주문자 정보</h3>
              <p className="text-sm text-gray-700">
                이름: {order.orderer_name ?? "미입력"}
              </p>
              <p className="text-sm text-gray-700">
                연락처: {order.orderer_phone ?? "미입력"}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">배송지 정보</h3>
              <p className="text-sm text-gray-700">
                수령자: {order.recipient_name}
              </p>
              <p className="text-sm text-gray-700">
                연락처: {order.recipient_phone}
              </p>
              <p className="text-sm text-gray-700">
                주소: [{order.zip_code ?? "-"}] {order.address}
                {order.detail_address ? ` ${order.detail_address}` : ""}
              </p>
              <p className="text-sm text-gray-700">
                요청사항: {order.request_message ?? "없음"}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="font-semibold">주문 상품</h3>
            <div className="mt-3 space-y-3">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.product_name_snapshot}
                    </p>
                    <p className="text-xs text-gray-500">
                      수량: {item.quantity}개
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.price_snapshot * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
            <p className="text-base font-bold">
              총 결제금액: {formatPrice(order.total_amount)}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
