"use client";

import { useRouter, useSearchParams } from "next/navigation";

type StatusBtn = {
  value: string;
  label: string;
  idle: string;
  active: string;
};

const STATUS_BUTTONS: StatusBtn[] = [
  {
    value: "pending",
    label: "입금 대기",
    idle:   "border-amber-200  text-amber-700  bg-amber-50  hover:bg-amber-100",
    active: "border-amber-400  text-white      bg-amber-500",
  },
  {
    value: "paid",
    label: "결제 완료",
    idle:   "border-green-200  text-green-700  bg-green-50  hover:bg-green-100",
    active: "border-green-500  text-white      bg-green-600",
  },
  {
    value: "preparing",
    label: "상품 준비중",
    idle:   "border-blue-200   text-blue-700   bg-blue-50   hover:bg-blue-100",
    active: "border-blue-500   text-white      bg-blue-600",
  },
  {
    value: "shipping",
    label: "배송 중",
    idle:   "border-[#c4b5fd] text-[#5332C9] bg-[#ede9fb] hover:bg-[#ddd6fe]",
    active: "border-[#5332C9] text-white     bg-[#5332C9]",
  },
  {
    value: "delivered",
    label: "배송 완료",
    idle:   "border-gray-200   text-gray-600   bg-gray-50   hover:bg-gray-100",
    active: "border-gray-500   text-white      bg-gray-500",
  },
  {
    value: "cancelled",
    label: "주문 취소",
    idle:   "border-red-200    text-[#FF5555]  bg-red-50    hover:bg-red-100",
    active: "border-red-500    text-white      bg-red-500",
  },
];

const VIRTUAL_BUTTONS: StatusBtn[] = [
  {
    value: "cancel_requested",
    label: "취소 요청",
    idle:   "border-orange-200  text-orange-700  bg-orange-50  hover:bg-orange-100",
    active: "border-orange-500  text-white        bg-orange-500",
  },
  {
    value: "return_requested",
    label: "반품 요청",
    idle:   "border-blue-200    text-blue-700    bg-blue-50    hover:bg-blue-100",
    active: "border-blue-600    text-white        bg-blue-600",
  },
  {
    value: "return_completed",
    label: "반품 완료",
    idle:   "border-green-200   text-green-700   bg-green-50   hover:bg-green-100",
    active: "border-green-600   text-white        bg-green-600",
  },
];

type Props = {
  currentStatuses: string[];
};

export default function AdminOrdersStatusFilter({ currentStatuses }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggle(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("status");
    } else {
      const current = (params.get("status") ?? "")
        .split(",")
        .filter(Boolean);
      const idx = current.indexOf(value);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      if (current.length === 0) {
        params.delete("status");
      } else {
        params.set("status", current.join(","));
      }
    }

    const qs = params.toString();
    router.push(`/admin/orders${qs ? `?${qs}` : ""}`);
  }

  const isAll = currentStatuses.length === 0;

  function btnCls(btn: StatusBtn) {
    const on = currentStatuses.includes(btn.value);
    return `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer select-none ${on ? btn.active : btn.idle}`;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {/* 전체 */}
        <button
          type="button"
          onClick={() => toggle("all")}
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer select-none ${
            isAll
              ? "border-[#5332C9] bg-[#5332C9] text-white"
              : "border-[#E8E6E1] bg-white text-[#6b7280] hover:bg-[#FAF9F6]"
          }`}
        >
          전체
        </button>

        {/* 주문 상태 버튼 */}
        {STATUS_BUTTONS.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => toggle(btn.value)}
            className={btnCls(btn)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 취소/반품 구분선 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-medium text-[#9ca3af]">취소·반품</span>
        {VIRTUAL_BUTTONS.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => toggle(btn.value)}
            className={btnCls(btn)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
