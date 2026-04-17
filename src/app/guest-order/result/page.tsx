import { getGuestOrderByOrderNumberAndPhone } from "@/src/server/orders";

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "입금 대기",
  paid: "결제 완료",
  preparing: "상품 준비중",
  shipping: "배송중",
  delivered: "배송 완료",
  cancelled: "주문 취소",
};
export default async function GuestOrderResultPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderNumber?: string;
    phone?: string;
  }>;
}) {
  const { orderNumber, phone } = await searchParams;

  if (!orderNumber || !phone) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl border bg-white p-8">
          <h1 className="text-2xl font-bold">비회원 주문조회</h1>
          <p className="mt-4 text-sm text-red-500">
            주문번호와 연락처가 필요합니다.
          </p>
        </div>
      </main>
    );
  }

  let order = null;
  let errorMessage = "";

  try {
    order = await getGuestOrderByOrderNumberAndPhone(orderNumber, phone);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "주문 조회 중 오류가 발생했습니다.";
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border bg-white p-8">
        <h1 className="text-2xl font-bold">비회원 주문조회 결과</h1>

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-500">{errorMessage}</p>
        ) : !order ? (
          <p className="mt-4 text-sm text-gray-600">
            일치하는 비회원 주문을 찾을 수 없습니다.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-xl bg-gray-50 p-4 text-sm">
              <p>
                <span className="font-semibold">주문번호:</span>{" "}
                {order.order_number}
              </p>
              <p className="mt-2">
                <span className="font-semibold">주문상태:</span>{" "}
                {ORDER_STATUS_LABEL[order.status] ?? order.status}
              </p>
              <p className="mt-2">
                <span className="font-semibold">주문자:</span>{" "}
                {order.orderer_name}
              </p>
              <p className="mt-2">
                <span className="font-semibold">주문자 연락처:</span>{" "}
                {order.orderer_phone}
              </p>
              {order.orderer_email && (
                <p className="mt-2">
                  <span className="font-semibold">주문자 이메일:</span>{" "}
                  {order.orderer_email}
                </p>
              )}
              <p className="mt-2">
                <span className="font-semibold">입금자명:</span>{" "}
                {order.depositor_name ?? "미입력"}
              </p>
              <p className="mt-2">
                <span className="font-semibold">총 결제금액:</span>{" "}
                {order.total_amount.toLocaleString()}원
              </p>
            </section>

            <section className="rounded-xl bg-gray-50 p-4 text-sm">
              <p>
                <span className="font-semibold">수령인:</span>{" "}
                {order.recipient_name}
              </p>
              <p className="mt-2">
                <span className="font-semibold">연락처 1:</span>{" "}
                {order.recipient_phone}
              </p>
              {order.recipient_phone_extra && (
                <p className="mt-2">
                  <span className="font-semibold">연락처 2:</span>{" "}
                  {order.recipient_phone_extra}
                </p>
              )}
              <p className="mt-2">
                <span className="font-semibold">주소:</span> (
                {order.zip_code ?? "-"}) {order.address}{" "}
                {order.detail_address ?? ""}
              </p>
              {order.request_message && (
                <p className="mt-2">
                  <span className="font-semibold">배송메모:</span>{" "}
                  {order.request_message}
                </p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold">주문 상품</h2>
              <div className="mt-4 space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">
                      {item.product_name_snapshot}
                    </p>
                    <p className="mt-1 text-gray-600">
                      수량: {item.quantity}개
                    </p>
                    <p className="mt-1 text-gray-600">
                      단가: {item.price_snapshot.toLocaleString()}원
                    </p>
                    <p className="mt-1 font-medium">
                      합계:{" "}
                      {(item.price_snapshot * item.quantity).toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
