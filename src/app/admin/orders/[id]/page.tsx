import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminOrderById,
  updateOrderStatus,
  updateOrderMemo,
  updateOrderTracking,
} from "@/src/server/orders";

// ── 택배사 목록 ──────────────────────────────────────────────────────────
const COURIERS: { code: string; name: string; url: (n: string) => string }[] = [
  {
    code: "cj",
    name: "CJ대한통운",
    url: (n) => `https://trace.cjlogistics.com/next/tracking.html?wblNum=${n}`,
  },
  {
    code: "hanjin",
    name: "한진택배",
    url: (n) =>
      `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KOR&wblnumText=${n}`,
  },
  {
    code: "lotte",
    name: "롯데택배",
    url: (n) =>
      `https://www.lotteglogis.com/mobile/reservation/tracking/linkView?InvNo=${n}`,
  },
  {
    code: "epost",
    name: "우체국택배",
    url: (n) =>
      `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${n}`,
  },
  {
    code: "logen",
    name: "로젠택배",
    url: (n) => `https://www.ilogen.com/m/personal/trace/${n}`,
  },
  {
    code: "kdexp",
    name: "경동택배",
    url: (n) => `https://kdexp.com/m/service/delivery/delivery.do?barcode=${n}`,
  },
  {
    code: "cu",
    name: "CU편의점택배",
    url: (n) =>
      `https://www.cupost.co.kr/postbox/delivery/localResult.cupost?transNo=${n}`,
  },
  {
    code: "gs",
    name: "GS25편의점택배",
    url: (n) => `https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=${n}`,
  },
  {
    code: "hyundai",
    name: "현대택배",
    url: (n) =>
      `https://www.hdexp.co.kr/parcel/goods_search/delivery_search.do?slipNoSearch=${n}`,
  },
];

function getTrackingUrl(
  courierCode: string | null,
  trackingNumber: string | null,
) {
  if (!courierCode || !trackingNumber) return null;
  const courier = COURIERS.find((c) => c.code === courierCode);
  return courier ? courier.url(trackingNumber) : null;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "입금 대기",
    cls: "bg-amber-50  text-amber-700  border-amber-200",
  },
  paid: {
    label: "결제 완료",
    cls: "bg-green-50  text-green-700  border-green-200",
  },
  preparing: {
    label: "상품 준비중",
    cls: "bg-blue-50   text-blue-700   border-blue-200",
  },
  shipping: {
    label: "배송 중",
    cls: "bg-[#ede9fb] text-[#5332C9] border-[#c4b5fd]",
  },
  delivered: {
    label: "배송 완료",
    cls: "bg-[#FAF9F6]  text-[#6b7280]   border-gray-200",
  },
  cancelled: {
    label: "주문 취소",
    cls: "bg-red-50    text-[#FF5555]  border-red-200",
  },
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) notFound();

  const order = await getAdminOrderById(orderId);
  if (!order) notFound();

  const statusCfg = STATUS_CONFIG[order.status] ?? {
    label: order.status,
    cls: "bg-[#FAF9F6] text-[#6b7280] border-gray-200",
  };

  function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex items-start gap-2 text-sm">
        <span className="w-24 shrink-0 text-[#9ca3af]">{label}</span>
        <span className="font-medium text-[#222222]">{value ?? "-"}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#5332C9]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            주문 목록으로
          </Link>
          <h1 className="text-xl font-bold text-[#222222] sm:text-2xl">
            주문 상세
          </h1>
          <p className="mt-0.5 text-sm text-[#6b7280]">{order.order_number}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${statusCfg.cls}`}
        >
          {statusCfg.label}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* 왼쪽: 정보 섹션들 */}
        <div className="space-y-5">
          {/* 기본 정보 */}
          <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-bold text-[#222222]">기본 정보</h2>
            <Row label="주문번호" value={order.order_number} />
            <Row
              label="주문일시"
              value={new Date(order.created_at).toLocaleString("ko-KR")}
            />
            <Row label="결제수단" value={order.payment_method} />
            <Row label="입금자명" value={order.depositor_name} />
          </section>

          {/* 주문자 정보 */}
          <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-bold text-[#222222]">주문자 정보</h2>
            <Row label="이름" value={order.orderer_name} />
            <Row label="연락처" value={order.orderer_phone} />
            <Row
              label="회원 ID"
              value={
                <span className="text-xs text-[#9ca3af]">{order.user_id}</span>
              }
            />
          </section>

          {/* 배송 정보 */}
          <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-bold text-[#222222]">배송 정보</h2>
            <Row label="수령인" value={order.recipient_name} />
            <Row label="연락처" value={order.recipient_phone} />
            <Row label="우편번호" value={order.zip_code} />
            <Row label="기본주소" value={order.address} />
            <Row label="상세주소" value={order.detail_address} />
            <Row label="요청사항" value={order.request_message} />
          </section>

          {/* 주문 상품 */}
          <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 sm:p-6">
            <h2 className="mb-4 text-sm font-bold text-[#222222]">주문 상품</h2>
            <div className="space-y-2.5">
              {order.order_items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#222222]">
                      {index + 1}. {item.product_name_snapshot}
                    </p>
                    <p className="mt-0.5 text-xs text-[#9ca3af]">
                      상품 ID: {item.product_id}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-[#6b7280]">
                      {item.price_snapshot.toLocaleString()}원 × {item.quantity}
                      개
                    </p>
                    <p className="font-bold text-[#222222]">
                      {(item.price_snapshot * item.quantity).toLocaleString()}
                      <span className="ml-0.5 text-xs font-normal text-[#6b7280]">
                        원
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 합계 */}
            <div className="mt-4 flex items-center justify-between border-t border-[#E8E6E1] pt-4">
              <span className="text-sm text-[#6b7280]">총 결제금액</span>
              <span className="text-lg font-bold text-[#222222]">
                {order.total_amount.toLocaleString()}
                <span className="ml-0.5 text-sm font-normal text-[#6b7280]">
                  원
                </span>
              </span>
            </div>
          </section>
        </div>

        {/* 오른쪽: 상태 변경 + 비고 메모 패널 */}
        <aside className="space-y-4 h-fit lg:sticky lg:top-6">
          {/* 상태 변경 */}
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-[#222222]">
              주문 상태 변경
            </h2>

            <div className="mb-4 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1] px-4 py-3 text-sm">
              <p className="text-xs text-[#6b7280]">현재 상태</p>
              <span
                className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.cls}`}
              >
                {statusCfg.label}
              </span>
            </div>

            <form action={updateOrderStatus} className="space-y-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="status"
                defaultValue={order.status}
                className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-1 focus:ring-[#5332C9]"
              >
                <option value="pending">입금 대기</option>
                <option value="paid">결제 완료</option>
                <option value="preparing">상품 준비중</option>
                <option value="shipping">배송 중</option>
                <option value="delivered">배송 완료</option>
                <option value="cancelled">주문 취소</option>
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-[#5332C9] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4427b0]"
              >
                상태 변경 저장
              </button>
            </form>
          </div>

          {/* 송장번호 입력 */}
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
            <h2 className="mb-1 text-sm font-bold text-[#222222]">송장번호</h2>
            <p className="mb-3 text-xs text-[#9ca3af]">
              입력 시 상태가 자동으로 &apos;배송 중&apos;으로 변경됩니다.
            </p>

            {/* 현재 송장 정보 표시 */}
            {order.tracking_number && (
              <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-[11px] text-blue-500 font-medium mb-1">
                  {COURIERS.find((c) => c.code === order.courier_code)?.name ??
                    order.courier_code}
                </p>
                <p className="font-mono text-sm font-bold text-[#222222]">
                  {order.tracking_number}
                </p>
                {getTrackingUrl(order.courier_code, order.tracking_number) && (
                  <a
                    href={
                      getTrackingUrl(order.courier_code, order.tracking_number)!
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    배송 추적
                  </a>
                )}
              </div>
            )}

            <form action={updateOrderTracking} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select
                name="courier_code"
                defaultValue={order.courier_code ?? ""}
                className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-1 focus:ring-[#5332C9]"
              >
                <option value="">택배사 선택</option>
                {COURIERS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="tracking_number"
                defaultValue={order.tracking_number ?? ""}
                placeholder="송장번호 입력"
                className="w-full rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm font-mono focus:border-[#5332C9] focus:outline-none focus:ring-1 focus:ring-[#5332C9]"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              >
                송장 저장
              </button>
            </form>
          </div>

          {/* 비고 메모 */}
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
            <h2 className="mb-1 text-sm font-bold text-[#222222]">
              비고 (관리자 메모)
            </h2>
            <p className="mb-3 text-xs text-[#9ca3af]">
              주문 목록에서 빨간 글씨로 표시됩니다.
            </p>

            {order.admin_memo && (
              <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                <p className="text-xs font-medium text-[#FF5555]">
                  {order.admin_memo}
                </p>
              </div>
            )}

            <form action={updateOrderMemo} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea
                name="admin_memo"
                defaultValue={order.admin_memo ?? ""}
                placeholder="예: 입금 확인 완료, 별도 연락 필요 등"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-1 focus:ring-[#5332C9]"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-white border border-[#E8E6E1] px-4 py-2 text-sm font-medium text-[#222222] transition-colors hover:bg-[#FAF9F6]"
              >
                메모 저장
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
