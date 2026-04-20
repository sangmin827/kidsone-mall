"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { MyOrder } from "@/src/server/orders";

// ── 타입 ──────────────────────────────────────────────────────────────
type StatusKey = MyOrder["status"];
type FilterStatus = "all" | StatusKey;
type DateRange = "all" | "7d" | "30d" | "90d";

// ── 상태 설정 ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; color: string; bg: string; dot: string; step: number }
> = {
  pending:   { label: "입금 대기",   color: "text-[#92400e]", bg: "bg-[#fef9ec]", dot: "bg-[#D4AF37]", step: 0 },
  paid:      { label: "결제 완료",   color: "text-[#5332C9]", bg: "bg-[#ede9fb]", dot: "bg-[#5332C9]", step: 1 },
  preparing: { label: "준비 중",     color: "text-[#1d4ed8]", bg: "bg-blue-50",   dot: "bg-[#3b82f6]", step: 2 },
  shipping:  { label: "배송 중",     color: "text-[#c2410c]", bg: "bg-orange-50", dot: "bg-[#f97316]", step: 3 },
  delivered: { label: "배송 완료",   color: "text-[#15803d]", bg: "bg-green-50",  dot: "bg-[#22c55e]", step: 4 },
  cancelled: { label: "취소됨",      color: "text-[#6b7280]", bg: "bg-[#f9fafb]", dot: "bg-[#9ca3af]", step: -1 },
};

const STEP_KEYS: StatusKey[] = ["pending", "paid", "preparing", "shipping", "delivered"];

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all",       label: "전체" },
  { value: "pending",   label: "입금 대기" },
  { value: "paid",      label: "결제 완료" },
  { value: "preparing", label: "준비 중" },
  { value: "shipping",  label: "배송 중" },
  { value: "delivered", label: "배송 완료" },
  { value: "cancelled", label: "취소" },
];

const DATE_FILTERS: { value: DateRange; label: string }[] = [
  { value: "all", label: "전체 기간" },
  { value: "7d",  label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
  { value: "90d", label: "최근 3개월" },
];

// ── 유틸 ──────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getThreshold(range: DateRange): Date | null {
  if (range === "all") return null;
  const d = new Date();
  if (range === "7d")  d.setDate(d.getDate() - 7);
  if (range === "30d") d.setDate(d.getDate() - 30);
  if (range === "90d") d.setDate(d.getDate() - 90);
  return d;
}

// ── 상태 배지 ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusKey }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.color}`}
    >
      <span className={`h-1.5 w-1.5 flex-none rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

// ── 단계 타임라인 ──────────────────────────────────────────────────────
function OrderTimeline({ status }: { status: StatusKey }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span className="text-sm font-medium text-[#6b7280]">주문이 취소된 상태입니다.</span>
      </div>
    );
  }

  const currentStep = STATUS_CONFIG[status].step;

  return (
    <div className="flex items-start">
      {STEP_KEYS.map((key, idx) => {
        const isDone = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isLast = idx === STEP_KEYS.length - 1;

        return (
          <div key={key} className="flex flex-1 flex-col items-center">
            {/* 라인 + 도트 */}
            <div className="flex w-full items-center">
              <div
                className={`relative z-10 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition-all sm:h-6 sm:w-6 ${
                  isDone
                    ? "border-[#5332C9] bg-[#5332C9]"
                    : isCurrent
                    ? "border-[#5332C9] bg-white shadow-[0_0_0_3px_rgba(83,50,201,0.12)]"
                    : "border-[#E8E6E1] bg-white"
                }`}
              >
                {isDone && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isCurrent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5332C9] sm:h-2 sm:w-2" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`h-[2px] flex-1 transition-all ${
                    isDone || isCurrent ? "bg-[#5332C9]" : "bg-[#E8E6E1]"
                  }`}
                />
              )}
            </div>
            {/* 라벨 */}
            <span
              className={`mt-1.5 text-center text-[9px] font-medium leading-tight sm:text-[10px] ${
                isCurrent
                  ? "font-bold text-[#5332C9]"
                  : isDone
                  ? "text-[#9ca3af]"
                  : "text-[#d1d5db]"
              }`}
            >
              {STATUS_CONFIG[key].label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 모달 내 정보 행 ────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="w-[72px] flex-none text-xs text-[#9ca3af]">{label}</span>
      <span className="break-all text-sm font-medium text-[#222222]">{value}</span>
    </div>
  );
}

// ── 모달 섹션 제목 ─────────────────────────────────────────────────────
function SectionTitle({
  num, title, sub,
}: {
  num: number; title: string; sub?: string;
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#222222]">
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#ede9fb] text-[10px] font-black text-[#5332C9]">
        {num}
      </span>
      {title}
      {sub && <span className="text-xs font-normal text-[#9ca3af]">{sub}</span>}
    </h3>
  );
}

// ── 주문 상세 모달 ─────────────────────────────────────────────────────
function OrderModal({ order, onClose }: { order: MyOrder; onClose: () => void }) {
  // body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ESC 키 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const totalQty = order.order_items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 모달 패널 */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-white sm:inset-0 sm:m-auto sm:max-h-[88vh] sm:max-w-lg sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="주문 상세"
      >
        {/* ── Sticky 헤더 ── */}
        <div className="flex-none px-5 pb-4 pt-4">
          {/* 드래그 핸들 (모바일) */}
          <div className="mb-3 flex justify-center sm:hidden">
            <div className="h-1 w-10 rounded-full bg-[#E8E6E1]" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5">
                <StatusBadge status={order.status} />
              </div>
              <p className="text-base font-bold leading-tight text-[#222222]">
                주문번호 {order.order_number}
              </p>
              <p className="mt-0.5 text-xs text-[#9ca3af]">{fmtDateTime(order.created_at)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#FAF9F6]"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 단계 타임라인 */}
          <div className="mt-4 px-1">
            <OrderTimeline status={order.status} />
          </div>
        </div>

        <div className="h-px flex-none bg-[#E8E6E1]" />

        {/* ── 스크롤 영역 ── */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">

          {/* 섹션 1 – 주문 상품 */}
          <section>
            <SectionTitle num={1} title="주문 상품" sub={`총 ${totalQty}개`} />
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#222222]">
                      {item.product_name_snapshot}
                    </p>
                    <p className="mt-0.5 text-xs text-[#9ca3af]">
                      {item.price_snapshot.toLocaleString()}원 × {item.quantity}개
                    </p>
                  </div>
                  <p className="flex-none text-sm font-bold text-[#222222]">
                    {(item.price_snapshot * item.quantity).toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
            {/* 결제 합계 */}
            <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-[#c4b5fd]/40 bg-[#ede9fb] px-4 py-3">
              <div className="text-xs text-[#6b7280]">
                배송비{" "}
                <span className="font-semibold text-[#15803d]">무료</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#9ca3af]">총 결제금액</p>
                <p className="text-base font-black text-[#5332C9]">
                  {order.total_amount.toLocaleString()}원
                </p>
              </div>
            </div>
          </section>

          {/* 섹션 2 – 배송지 정보 */}
          <section>
            <SectionTitle num={2} title="배송지 정보" />
            <div className="overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white divide-y divide-[#F3F2EE]">
              <InfoRow label="수령자" value={order.recipient_name} />
              <InfoRow label="연락처" value={order.recipient_phone} />
              {order.recipient_phone_extra && (
                <InfoRow label="연락처 2" value={order.recipient_phone_extra} />
              )}
              <InfoRow
                label="주소"
                value={`${order.zip_code ? `[${order.zip_code}] ` : ""}${order.address}${order.detail_address ? ` ${order.detail_address}` : ""}`}
              />
              {order.request_message && (
                <InfoRow label="요청사항" value={order.request_message} />
              )}
            </div>
          </section>

          {/* 섹션 3 – 결제 정보 */}
          <section>
            <SectionTitle num={3} title="결제 정보" />
            <div className="overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white divide-y divide-[#F3F2EE]">
              <InfoRow label="결제 방식" value="무통장 입금" />
              {order.depositor_name && (
                <InfoRow label="입금자명" value={order.depositor_name} />
              )}
              {order.orderer_name && (
                <InfoRow label="주문자" value={order.orderer_name} />
              )}
              {order.orderer_phone && (
                <InfoRow label="주문자 연락처" value={order.orderer_phone} />
              )}
              {order.orderer_email && (
                <InfoRow label="이메일" value={order.orderer_email} />
              )}
            </div>
          </section>

          <div className="pb-2" />
        </div>
      </div>
    </>
  );
}

// ── 주문 카드 ──────────────────────────────────────────────────────────
function OrderCard({ order, onClick }: { order: MyOrder; onClick: () => void }) {
  const firstItem = order.order_items[0];
  const extraCount = order.order_items.length - 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-[#E8E6E1] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#5332C9]/20 hover:shadow-md active:scale-[0.99]"
    >
      {/* 상단: 날짜 + 상태 배지 */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-[#9ca3af]">{fmtDate(order.created_at)}</span>
        <StatusBadge status={order.status} />
      </div>

      {/* 중단: 상품명 + 주문번호 */}
      <div className="mb-3">
        <p className="line-clamp-1 text-sm font-semibold text-[#222222]">
          {firstItem?.product_name_snapshot ?? "상품명 없음"}
          {extraCount > 0 && (
            <span className="ml-1 text-xs font-normal text-[#9ca3af]">
              외 {extraCount}건
            </span>
          )}
        </p>
        <p className="mt-0.5 font-mono text-xs text-[#9ca3af]">{order.order_number}</p>
      </div>

      {/* 하단: 금액 + 상세 보기 */}
      <div className="flex items-center justify-between border-t border-[#F3F2EE] pt-3">
        <p className="text-base font-black text-[#222222]">
          {order.total_amount.toLocaleString()}
          <span className="ml-0.5 text-sm font-normal text-[#6b7280]">원</span>
        </p>
        <div className="flex items-center gap-1 text-xs font-medium text-[#9ca3af] transition-colors group-hover:text-[#5332C9]">
          상세 보기
          <svg
            xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ── 스켈레톤 ──────────────────────────────────────────────────────────
function OrderCardSkeleton() {
  return (
    <div className="space-y-2.5 rounded-2xl border border-[#E8E6E1] bg-white p-4">
      <div className="flex justify-between">
        <div className="h-3 w-20 animate-pulse rounded-full bg-[#E8E6E1]" />
        <div className="h-4 w-16 animate-pulse rounded-full bg-[#E8E6E1]" />
      </div>
      <div className="h-4 w-48 animate-pulse rounded-full bg-[#E8E6E1]" />
      <div className="h-3 w-36 animate-pulse rounded-full bg-[#E8E6E1]" />
      <div className="flex justify-between border-t border-[#F3F2EE] pt-3">
        <div className="h-5 w-24 animate-pulse rounded-full bg-[#E8E6E1]" />
        <div className="h-4 w-14 animate-pulse rounded-full bg-[#E8E6E1]" />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────
type Props = { orders: MyOrder[] };

export default function OrderList({ orders }: Props) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<MyOrder | null>(null);
  const [isLoading] = useState(false);

  const filtered = useMemo(() => {
    const threshold = getThreshold(dateRange);
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (threshold && new Date(order.created_at) < threshold) return false;
      if (q) {
        const match =
          order.order_number.toLowerCase().includes(q) ||
          order.order_items.some((i) =>
            i.product_name_snapshot.toLowerCase().includes(q)
          );
        if (!match) return false;
      }
      return true;
    });
  }, [orders, statusFilter, dateRange, searchQuery]);

  const hasActiveFilter =
    statusFilter !== "all" || dateRange !== "all" || searchQuery.trim() !== "";

  const resetFilters = () => {
    setStatusFilter("all");
    setDateRange("all");
    setSearchQuery("");
  };

  return (
    <>
      {/* ━━━ 필터 영역 ━━━ */}
      <div className="mb-5 space-y-3">

        {/* 검색 인풋 */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="주문번호 또는 상품명 검색"
            className="w-full rounded-xl border border-[#E8E6E1] bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-[#5332C9] focus:ring-2 focus:ring-[#5332C9]/15"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#9ca3af] transition-colors hover:text-[#222222]"
              aria-label="검색어 지우기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </div>

        {/* 상태 필터 탭 + 기간 드롭다운 */}
        <div className="flex items-center gap-2">

          {/* 상태 탭 — 가로 스크롤 (모바일) */}
          <div className="min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1.5 pb-0.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`flex-none whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === f.value
                      ? "bg-[#5332C9] text-white shadow-sm"
                      : "border border-[#E8E6E1] bg-white text-[#6b7280] hover:border-[#5332C9]/30 hover:text-[#5332C9]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 기간 드롭다운 */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="flex-none rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-xs font-medium text-[#6b7280] outline-none transition-colors hover:border-[#5332C9]/30 focus:border-[#5332C9]"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* 결과 수 + 필터 초기화 */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#9ca3af]">
            {filtered.length > 0 && (
              <>
                총{" "}
                <span className="font-semibold text-[#222222]">{filtered.length}건</span>
              </>
            )}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-[#9ca3af] transition-colors hover:bg-[#FAF9F6] hover:text-[#222222]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* ━━━ 스켈레톤 ━━━ */}
      {isLoading && (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ━━━ 빈 상태 ━━━ */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[#E8E6E1] bg-white px-6 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6] text-3xl">
            📦
          </div>
          <div>
            <p className="text-sm font-bold text-[#222222]">
              {hasActiveFilter
                ? "조건에 맞는 주문이 없어요"
                : "아직 주문 내역이 없어요"}
            </p>
            <p className="mt-1 text-xs text-[#6b7280]">
              {hasActiveFilter
                ? "필터 조건을 변경해 보세요."
                : "첫 번째 주문을 해보세요!"}
            </p>
          </div>
          {hasActiveFilter ? (
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-[#E8E6E1] px-4 py-2 text-xs font-semibold text-[#6b7280] transition-colors hover:border-[#5332C9] hover:text-[#5332C9]"
            >
              필터 초기화
            </button>
          ) : (
            <Link
              href="/products"
              className="rounded-xl bg-[#5332C9] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#4427b0]"
            >
              상품 보러가기
            </Link>
          )}
        </div>
      )}

      {/* ━━━ 주문 카드 목록 ━━━ */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}

      {/* ━━━ 모달 ━━━ */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
