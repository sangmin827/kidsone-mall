"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  search?: string;
  status?: string;       // 쉼표 구분 문자열 그대로 전달
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
};

const STATUS_OPTIONS = [
  { value: "pending",          label: "입금 대기",   idle: "border-amber-200  text-amber-700  bg-amber-50",   active: "border-amber-400  text-white bg-amber-500"  },
  { value: "paid",             label: "결제 완료",   idle: "border-green-200  text-green-700  bg-green-50",   active: "border-green-500  text-white bg-green-600"  },
  { value: "preparing",        label: "상품 준비중", idle: "border-blue-200   text-blue-700   bg-blue-50",    active: "border-blue-500   text-white bg-blue-600"   },
  { value: "shipping",         label: "배송 중",     idle: "border-[#c4b5fd] text-[#5332C9] bg-[#ede9fb]",  active: "border-[#5332C9] text-white  bg-[#5332C9]"  },
  { value: "delivered",        label: "배송 완료",   idle: "border-gray-200   text-gray-600   bg-gray-50",    active: "border-gray-500   text-white bg-gray-500"   },
  { value: "cancelled",        label: "주문 취소",   idle: "border-red-200    text-[#FF5555]  bg-red-50",     active: "border-red-500    text-white bg-red-500"    },
  { value: "cancel_requested", label: "취소 요청",   idle: "border-orange-200 text-orange-700 bg-orange-50",  active: "border-orange-500 text-white bg-orange-500" },
  { value: "return_requested", label: "반품 요청",   idle: "border-blue-200   text-blue-700   bg-blue-50",    active: "border-blue-600   text-white bg-blue-600"   },
  { value: "return_completed", label: "반품 완료",   idle: "border-green-200  text-green-700  bg-green-50",   active: "border-green-600  text-white bg-green-600"  },
];

const STATUS_LABEL_MAP: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

const SORT_OPTIONS = [
  { value: "newest",      label: "최신순" },
  { value: "oldest",      label: "오래된순" },
  { value: "amount_desc", label: "금액 높은순" },
  { value: "amount_asc",  label: "금액 낮은순" },
];

export default function AdminOrdersMobileFilter({
  search,
  status,
  dateFrom,
  dateTo,
  sort,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // 현재 선택된 상태 배열
  const currentStatuses = (status ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "all");

  function toggleStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      const cur = (params.get("status") ?? "").split(",").filter(Boolean);
      const idx = cur.indexOf(value);
      if (idx >= 0) cur.splice(idx, 1);
      else cur.push(value);
      if (cur.length === 0) params.delete("status");
      else params.set("status", cur.join(","));
    }
    const qs = params.toString();
    router.push(`/admin/orders${qs ? `?${qs}` : ""}`);
  }

  /* 애니메이션: isOpen 변경 → 다음 프레임에서 visible 동기화 */
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(isOpen));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  /* 열려 있을 때 body 스크롤 막기 */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const hasFilter = !!(
    search ||
    currentStatuses.length > 0 ||
    dateFrom ||
    dateTo
  );

  /* 요약 태그 */
  const tags: string[] = [];
  if (search) tags.push(`"${search}"`);
  if (currentStatuses.length > 0)
    tags.push(currentStatuses.map((s) => STATUS_LABEL_MAP[s] ?? s).join(", "));
  if (dateFrom && dateTo) tags.push(`${dateFrom} ~ ${dateTo}`);
  else if (dateFrom) tags.push(`${dateFrom} ~`);
  else if (dateTo) tags.push(`~ ${dateTo}`);

  const validSort =
    sort === "oldest" || sort === "amount_desc" || sort === "amount_asc"
      ? sort
      : "newest";

  return (
    <>
      {/* ── 활성 필터 요약 바 (모바일, 필터 있을 때만) ── */}
      {hasFilter && (
        <div className="md:hidden flex items-center gap-2 rounded-xl border border-[#5332C9]/30 bg-[#ede9fb] px-3 py-2">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5332C9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="flex-1 truncate text-xs font-medium text-[#5332C9]">
            {tags.join(" · ")}
          </span>
          <Link
            href="/admin/orders"
            className="shrink-0 rounded-full bg-[#5332C9]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5332C9] hover:bg-[#5332C9]/20"
          >
            초기화
          </Link>
        </div>
      )}

      {/* ── 플로팅 검색 버튼 (모바일) ── */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          md:hidden fixed bottom-6 right-5 z-[150] flex h-14 w-14 items-center justify-center
          rounded-full shadow-lg transition-colors
          ${hasFilter
            ? "bg-[#5332C9] text-white ring-4 ring-[#5332C9]/20"
            : "bg-[#5332C9] text-white"}
        `}
        aria-label="검색 / 필터 열기"
      >
        {hasFilter ? (
          /* 필터 적용 중 — funnel 아이콘 */
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        ) : (
          /* 기본 — 돋보기 아이콘 */
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
        {/* 필터 적용 중 빨간 점 */}
        {hasFilter && (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#FF5555] ring-2 ring-white" />
        )}
      </button>

      {/* ── 바텀 시트 ── */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex flex-col justify-end">
          {/* 배경 딤 */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
            onClick={() => setIsOpen(false)}
          />

          {/* 시트 본체 */}
          <div
            className={`relative rounded-t-3xl bg-white px-5 pt-4 pb-10 transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
          >
            {/* 핸들 바 */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E6E1]" />

            {/* 시트 헤더 */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#222222]">검색 / 필터</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF9F6] text-[#6b7280]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 필터 폼 */}
            <form method="get" action="/admin/orders" className="space-y-4">
              {/* 상태 선택은 버튼 토글로 URL에 이미 반영됨 — 검색 폼 제출 시 보존 */}
              {currentStatuses.length > 0 && (
                <input type="hidden" name="status" value={currentStatuses.join(",")} />
              )}
              {/* 검색어 */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                  검색어
                </label>
                <input
                  type="text"
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="주문번호 · 주문자명 · 수령인명"
                  className="w-full rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
                />
              </div>

              {/* 상태 토글 버튼 */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                  상태 <span className="font-normal text-[#9ca3af]">(중복 선택 가능)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {/* 전체 */}
                  <button
                    type="button"
                    onClick={() => toggleStatus("all")}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      currentStatuses.length === 0
                        ? "border-[#5332C9] bg-[#5332C9] text-white"
                        : "border-[#E8E6E1] bg-white text-[#6b7280]"
                    }`}
                  >
                    전체
                  </button>
                  {STATUS_OPTIONS.map((opt) => {
                    const on = currentStatuses.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleStatus(opt.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? opt.active : opt.idle}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 날짜 범위 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                    시작일
                  </label>
                  <input
                    type="date"
                    name="dateFrom"
                    defaultValue={dateFrom ?? ""}
                    className="w-full rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                    종료일
                  </label>
                  <input
                    type="date"
                    name="dateTo"
                    defaultValue={dateTo ?? ""}
                    className="w-full rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
                  />
                </div>
              </div>

              {/* 정렬 */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                  정렬
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm has-[:checked]:border-[#5332C9] has-[:checked]:bg-[#ede9fb] has-[:checked]:text-[#5332C9]"
                    >
                      <input
                        type="radio"
                        name="sort"
                        value={opt.value}
                        defaultChecked={validSort === opt.value}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-1">
                <Link
                  href="/admin/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-3 text-center text-sm font-medium text-[#6b7280]"
                >
                  초기화
                </Link>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5332C9] py-3 text-sm font-semibold text-white hover:bg-[#4427b0] transition-colors"
                >
                  검색 적용
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
