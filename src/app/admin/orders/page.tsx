import Link from "next/link";
import { getAdminOrders } from "@/src/server/orders";
import AdminOrdersMobileFilter from "@/src/components/admin/orders/AdminOrdersMobileFilter";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: "입금 대기",   cls: "bg-amber-50  text-amber-700  border-amber-200"  },
  paid:      { label: "결제 완료",   cls: "bg-green-50  text-green-700  border-green-200"  },
  preparing: { label: "상품 준비중", cls: "bg-blue-50   text-blue-700   border-blue-200"   },
  shipping:  { label: "배송 중",     cls: "bg-[#ede9fb] text-[#5332C9] border-[#c4b5fd]"  },
  delivered: { label: "배송 완료",   cls: "bg-[#FAF9F6] text-[#6b7280] border-gray-200"   },
  cancelled: { label: "주문 취소",   cls: "bg-red-50    text-[#FF5555] border-red-200"    },
};

const SORT_OPTIONS = [
  { value: "newest",      label: "최신순" },
  { value: "oldest",      label: "오래된순" },
  { value: "amount_desc", label: "금액 높은순" },
  { value: "amount_asc",  label: "금액 낮은순" },
];

const MEMO_MAX = 28;

type Props = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { search, status, dateFrom, dateTo, sort } = await searchParams;

  const validSort =
    sort === "oldest" || sort === "amount_desc" || sort === "amount_asc"
      ? sort
      : "newest";

  const orders = await getAdminOrders({
    search: search?.trim() || undefined,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sort: validSort,
  });

  const hasFilter = !!(search || (status && status !== "all") || dateFrom || dateTo);

  // Build export URL with current filters
  const exportParams = new URLSearchParams();
  if (search) exportParams.set("search", search);
  if (status && status !== "all") exportParams.set("status", status);
  if (dateFrom) exportParams.set("dateFrom", dateFrom);
  if (dateTo) exportParams.set("dateTo", dateTo);
  const exportHref = `/api/admin/orders/export${exportParams.toString() ? `?${exportParams}` : ""}`;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#222222] sm:text-2xl">주문 내역 관리</h1>
          <p className="mt-0.5 text-sm text-[#6b7280]">
            총 <span className="font-semibold text-[#222222]">{orders.length}</span>건
            {hasFilter && <span className="ml-1 text-[#5332C9]">(필터 적용됨)</span>}
          </p>
        </div>

        {/* 엑셀 다운로드 */}
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E8E6E1] bg-white px-4 py-2 text-sm font-medium text-[#222222] hover:bg-[#FAF9F6] transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          엑셀 다운로드
        </a>
      </div>

      {/* 모바일 필터 요약 + 플로팅 버튼 + 바텀시트 */}
      <AdminOrdersMobileFilter
        search={search}
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        sort={validSort}
      />

      {/* 검색 / 필터 — 데스크탑 전용 */}
      <form
        method="get"
        className="hidden md:block rounded-2xl border border-[#E8E6E1] bg-white p-4 space-y-3"
      >
        {/* 검색어 */}
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="주문번호 · 주문자명 · 수령인명 검색"
            className="flex-1 rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#5332C9] px-4 py-2 text-sm font-medium text-white hover:bg-[#4427b0] transition-colors"
          >
            검색
          </button>
          {hasFilter && (
            <Link
              href="/admin/orders"
              className="rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm text-[#6b7280] hover:bg-[#FAF9F6] transition-colors"
            >
              초기화
            </Link>
          )}
        </div>

        {/* 상태 · 날짜 · 정렬 */}
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">상태</label>
            <select
              name="status"
              defaultValue={status ?? "all"}
              className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
            >
              <option value="all">전체</option>
              <option value="pending">입금 대기</option>
              <option value="paid">결제 완료</option>
              <option value="preparing">상품 준비중</option>
              <option value="shipping">배송 중</option>
              <option value="delivered">배송 완료</option>
              <option value="cancelled">주문 취소</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">시작일</label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom ?? ""}
              className="rounded-xl border border-[#E8E6E1] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">종료일</label>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo ?? ""}
              className="rounded-xl border border-[#E8E6E1] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">정렬</label>
            <select
              name="sort"
              defaultValue={validSort}
              className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* 빈 상태 */}
      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[#E8E6E1] bg-white py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6] text-3xl">📦</div>
          <div>
            <p className="font-semibold text-[#222222]">
              {hasFilter ? "검색 결과가 없습니다" : "아직 주문이 없습니다"}
            </p>
            <p className="mt-1 text-sm text-[#6b7280]">
              {hasFilter ? "검색 조건을 변경해 보세요." : "주문이 들어오면 여기에 표시됩니다."}
            </p>
          </div>
        </div>
      )}

      {/* 주문 목록 */}
      {orders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white">
          {/* 테이블 헤더 — PC */}
          <div className="hidden grid-cols-[1fr_120px_100px_120px] gap-4 border-b border-[#E8E6E1] bg-[#FAF9F6] px-5 py-3 text-xs font-semibold text-[#6b7280] md:grid">
            <div>주문 정보</div>
            <div>주문자 / 수령인</div>
            <div>상태</div>
            <div className="text-right">금액</div>
          </div>

          <div className="divide-y divide-[#E8E6E1]">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, cls: "bg-[#FAF9F6] text-[#6b7280] border-gray-200" };
              const memo = order.admin_memo ?? "";
              const memoTruncated = memo.length > MEMO_MAX ? memo.slice(0, MEMO_MAX) + "..." : memo;

              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block px-5 py-3.5 transition-colors hover:bg-[#FAF9F6]"
                >
                  {/* ── 모바일 레이아웃 ── */}
                  <div className="md:hidden space-y-1">
                    {/* 행 1: 상태 + 금액 */}
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-[#222222]">
                        {order.total_amount.toLocaleString()}<span className="ml-0.5 text-xs font-normal text-[#6b7280]">원</span>
                      </span>
                    </div>
                    {/* 행 2: 주문번호 + 날짜 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#222222]">{order.order_number}</span>
                      <span className="text-[11px] text-[#9ca3af]">
                        {new Date(order.created_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    {/* 행 3: 주문자 + 상품 건수 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6b7280]">
                        {order.orderer_name ?? order.recipient_name}
                        {order.is_guest && <span className="ml-1 text-[10px] text-[#9ca3af]">(비회원)</span>}
                      </span>
                      <span className="text-[11px] text-[#9ca3af]">상품 {order.order_items.length}건</span>
                    </div>
                    {/* 행 4: 메모 (있을 때만) */}
                    {memo && (
                      <p className="text-[11px] font-medium text-[#FF5555]">
                        ✎ {memoTruncated}
                      </p>
                    )}
                  </div>

                  {/* ── PC 레이아웃 ── */}
                  <div className="hidden md:grid md:grid-cols-[1fr_120px_100px_120px] md:items-start md:gap-4">
                    {/* 주문 정보 */}
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-semibold text-[#222222]">{order.order_number}</p>
                      <p className="text-xs text-[#9ca3af]">
                        {new Date(order.created_at).toLocaleString("ko-KR")}
                      </p>
                      <p className="text-xs text-[#6b7280]">상품 {order.order_items.length}건</p>
                      {memo && (
                        <p className="text-xs font-medium text-[#FF5555]">✎ {memoTruncated}</p>
                      )}
                    </div>

                    {/* 주문자 / 수령인 */}
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm text-[#222222]">
                        {order.orderer_name ?? "-"}
                        {order.is_guest && <span className="ml-1 text-[10px] text-[#9ca3af]">(비)</span>}
                      </p>
                      <p className="truncate text-xs text-[#6b7280]">
                        {order.recipient_name}
                      </p>
                    </div>

                    {/* 상태 배지 */}
                    <div>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* 금액 */}
                    <div className="text-right text-sm font-bold text-[#222222]">
                      {order.total_amount.toLocaleString()}<span className="ml-0.5 text-xs font-normal text-[#6b7280]">원</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
