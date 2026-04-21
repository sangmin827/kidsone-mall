"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MyOrder } from "@/src/server/orders";
import {
  createCancelRequest,
  createReturnRequest,
  requestCancelWithdrawal,
  requestReturnWithdrawal,
} from "@/src/server/cancel-return";

// 반품 왕복 배송비 (변경 시 이 값만 수정)
const RETURN_SHIPPING_FEE = "왕복 10,000원";

// ── 타입 ──────────────────────────────────────────────────────────────
type StatusKey = MyOrder["status"];
type FilterStatus = "all" | StatusKey;
type DateRange = "all" | "7d" | "30d" | "90d";
type ModalView = "detail" | "cancel" | "return" | "cancel-withdraw" | "return-withdraw";

// ── 상태 설정 ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; color: string; bg: string; dot: string; step: number }
> = {
  pending: {
    label: "입금 대기",
    color: "text-[#92400e]",
    bg: "bg-[#fef9ec]",
    dot: "bg-[#D4AF37]",
    step: 0,
  },
  paid: {
    label: "결제 완료",
    color: "text-[#5332C9]",
    bg: "bg-[#ede9fb]",
    dot: "bg-[#5332C9]",
    step: 1,
  },
  preparing: {
    label: "준비 중",
    color: "text-[#1d4ed8]",
    bg: "bg-blue-50",
    dot: "bg-[#3b82f6]",
    step: 2,
  },
  shipping: {
    label: "배송 중",
    color: "text-[#c2410c]",
    bg: "bg-orange-50",
    dot: "bg-[#f97316]",
    step: 3,
  },
  delivered: {
    label: "배송 완료",
    color: "text-[#15803d]",
    bg: "bg-green-50",
    dot: "bg-[#22c55e]",
    step: 4,
  },
  cancelled: {
    label: "취소됨",
    color: "text-[#6b7280]",
    bg: "bg-[#f9fafb]",
    dot: "bg-[#9ca3af]",
    step: -1,
  },
};

const CANCEL_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  requested: {
    label: "취소 접수",
    color: "text-[#c2410c]",
    bg: "bg-orange-50",
  },
  completed: {
    label: "취소 완료",
    color: "text-[#6b7280]",
    bg: "bg-[#f9fafb]",
  },
  rejected: { label: "취소 거절", color: "text-[#FF5555]", bg: "bg-red-50" },
  withdraw_requested: {
    label: "철회 요청 중",
    color: "text-[#92400e]",
    bg: "bg-[#fef9ec]",
  },
  withdraw_completed: {
    label: "철회 완료",
    color: "text-[#15803d]",
    bg: "bg-green-50",
  },
};

const RETURN_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  requested: {
    label: "반품 접수",
    color: "text-[#c2410c]",
    bg: "bg-orange-50",
  },
  picked_up: {
    label: "반품 수거중",
    color: "text-[#1d4ed8]",
    bg: "bg-blue-50",
  },
  completed: { label: "반품 완료", color: "text-[#15803d]", bg: "bg-green-50" },
  rejected: { label: "반품 거절", color: "text-[#FF5555]", bg: "bg-red-50" },
  withdraw_requested: {
    label: "철회 요청 중",
    color: "text-[#92400e]",
    bg: "bg-[#fef9ec]",
  },
  withdraw_completed: {
    label: "철회 완료",
    color: "text-[#15803d]",
    bg: "bg-green-50",
  },
};

const KOREAN_BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "SC제일은행",
  "씨티은행",
  "부산은행",
  "대구은행",
  "광주은행",
  "전북은행",
  "경남은행",
  "새마을금고",
  "신협",
  "우체국",
];

const STEP_KEYS: StatusKey[] = [
  "pending",
  "paid",
  "preparing",
  "shipping",
  "delivered",
];

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "입금 대기" },
  { value: "paid", label: "결제 완료" },
  { value: "preparing", label: "준비 중" },
  { value: "shipping", label: "배송 중" },
  { value: "delivered", label: "배송 완료" },
  { value: "cancelled", label: "취소" },
];

const DATE_FILTERS: { value: DateRange; label: string }[] = [
  { value: "all", label: "전체 기간" },
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
  { value: "90d", label: "최근 3개월" },
];

// ── 유틸 ──────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getThreshold(range: DateRange): Date | null {
  if (range === "all") return null;
  const d = new Date();
  if (range === "7d") d.setDate(d.getDate() - 7);
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

// ── 취소/반품 상태 배지 ────────────────────────────────────────────────
function CancelStatusBadge({ status }: { status: string }) {
  const c = CANCEL_STATUS_CONFIG[status] ?? CANCEL_STATUS_CONFIG.requested;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.color}`}
    >
      {c.label}
    </span>
  );
}

function ReturnStatusBadge({ status }: { status: string }) {
  const c = RETURN_STATUS_CONFIG[status] ?? RETURN_STATUS_CONFIG.requested;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg} ${c.color}`}
    >
      {c.label}
    </span>
  );
}

// ── 취소/반품 진행 상태 표시줄 ────────────────────────────────────────
function CancelProgressBar({ status }: { status: string }) {
  const steps = ["requested", "completed"];
  const labels = ["접수", "완료"];
  const current = steps.indexOf(status);
  if (current === -1) return null;
  return (
    <div className="flex items-start">
      {steps.map((s, idx) => {
        const isDone = idx < current;
        const isCurrent = idx === current;
        const isLast = idx === steps.length - 1;
        return (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`relative z-10 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                  isDone
                    ? "border-[#5332C9] bg-[#5332C9]"
                    : isCurrent
                      ? "border-[#5332C9] bg-white"
                      : "border-[#E8E6E1] bg-white"
                }`}
              >
                {isDone && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isCurrent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5332C9]" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`h-[2px] flex-1 ${isDone ? "bg-[#5332C9]" : "bg-[#E8E6E1]"}`}
                />
              )}
            </div>
            <span
              className={`mt-1.5 text-[9px] font-medium ${isCurrent ? "font-bold text-[#5332C9]" : isDone ? "text-[#9ca3af]" : "text-[#d1d5db]"}`}
            >
              {labels[idx]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReturnProgressBar({ status }: { status: string }) {
  const steps = ["requested", "picked_up", "completed"];
  const labels = ["접수", "수거", "완료"];
  const current = steps.indexOf(status);
  if (current === -1) return null;
  return (
    <div className="flex items-start">
      {steps.map((s, idx) => {
        const isDone = idx < current;
        const isCurrent = idx === current;
        const isLast = idx === steps.length - 1;
        return (
          <div key={s} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div
                className={`relative z-10 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                  isDone
                    ? "border-[#5332C9] bg-[#5332C9]"
                    : isCurrent
                      ? "border-[#5332C9] bg-white"
                      : "border-[#E8E6E1] bg-white"
                }`}
              >
                {isDone && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isCurrent && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5332C9]" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`h-[2px] flex-1 ${isDone ? "bg-[#5332C9]" : "bg-[#E8E6E1]"}`}
                />
              )}
            </div>
            <span
              className={`mt-1.5 text-[9px] font-medium ${isCurrent ? "font-bold text-[#5332C9]" : isDone ? "text-[#9ca3af]" : "text-[#d1d5db]"}`}
            >
              {labels[idx]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 단계 타임라인 ──────────────────────────────────────────────────────
function OrderTimeline({ status }: { status: StatusKey }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span className="text-sm font-medium text-[#6b7280]">
          주문이 취소된 상태입니다.
        </span>
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
                    xmlns="http://www.w3.org/2000/svg"
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                  className={`h-[2px] flex-1 transition-all ${isDone || isCurrent ? "bg-[#5332C9]" : "bg-[#E8E6E1]"}`}
                />
              )}
            </div>
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
      <span className="break-all text-sm font-medium text-[#222222]">
        {value}
      </span>
    </div>
  );
}

function SectionTitle({
  num,
  title,
  sub,
}: {
  num: number;
  title: string;
  sub?: string;
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

// ── 취소 안내 패널 ────────────────────────────────────────────────────
function CancelInfoBanner({ status }: { status: StatusKey }) {
  if (status === "pending") {
    return (
      <div className="rounded-xl border border-[#D4AF37]/40 bg-[#fef9ec] px-4 py-3 text-xs text-[#92400e] space-y-1">
        <p className="font-bold">💳 입금 대기 중 취소</p>
        <p>
          아직 입금이 확인되지 않은 주문입니다. 취소 시 주문이 즉시 취소되며,
          환불을 위해서 아래 환불 계좌 정보를 꼭 입력해 주세요.
        </p>
      </div>
    );
  }
  if (status === "paid") {
    return (
      <div className="rounded-xl border border-[#5332C9]/20 bg-[#ede9fb] px-4 py-3 text-xs text-[#5332C9] space-y-1">
        <p className="font-bold">✅ 결제 완료 — 즉시 취소 가능</p>
        <p>
          취소 신청 즉시 주문이 취소됩니다. 입금하신 금액은 관리자를 통해 환불
          처리됩니다.
        </p>
      </div>
    );
  }
  if (status === "preparing") {
    return (
      <div className="rounded-xl border border-[#3b82f6]/20 bg-blue-50 px-4 py-3 text-xs text-[#1d4ed8] space-y-1">
        <p className="font-bold">⚠️ 상품 준비 중 — 관리자 검토 후 취소</p>
        <p>
          현재 상품을 포장하고 출고 준비 중입니다. 이 단계에서는 취소 요청을
          접수한 후 관리자가 확인하여 처리합니다. 출고 전이라면 취소가 승인되며,
          이미 출고된 경우 취소가 거절될 수 있습니다.
        </p>
      </div>
    );
  }
  return null;
}

// ── 반품 안내 패널 ────────────────────────────────────────────────────
function ReturnInfoBanner({ status }: { status: StatusKey }) {
  if (status === "shipping") {
    return (
      <div className="rounded-xl border border-[#f97316]/20 bg-orange-50 px-4 py-3 text-xs text-[#c2410c] space-y-1">
        <p className="font-bold">🚚 배송 중 — 취소 불가 · 반품 가능</p>
        <p>
          현재 상품이 배송사로 이동되어 배송 중입니다. 이 단계에서는 취소가
          어려우며, 상품 수령 후 반품을 신청해 주세요.
        </p>
        <p className="mt-1 font-semibold">
          반품 배송비: {RETURN_SHIPPING_FEE} (단순 변심)
        </p>
      </div>
    );
  }
  if (status === "delivered") {
    return (
      <div className="rounded-xl border border-[#22c55e]/20 bg-green-50 px-4 py-3 text-xs text-[#15803d] space-y-1">
        <p className="font-bold">📬 배송 완료 — 반품 신청 가능</p>
        <p>
          배송 완료일로부터 <strong>7일 이내</strong>에 반품을 신청할 수
          있습니다.{" "}
          <Link
            href="/consumer-protection"
            className="underline font-semibold"
            target="_blank"
          >
            소비자 보호법
          </Link>
          에 따라 미개봉·미사용 상품에 한해 반품이 가능합니다.
        </p>
        <p className="font-semibold">
          반품 배송비: {RETURN_SHIPPING_FEE} (단순 변심)
        </p>
        <p className="text-red-700/70">
          제품의 사용 및 이상이 있을경우 <strong>반품이 제한</strong>될수
          있습니다.
        </p>
      </div>
    );
  }
  return null;
}

// ── 주문 상세 모달 ─────────────────────────────────────────────────────
function OrderModal({
  order,
  onClose,
}: {
  order: MyOrder;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<ModalView>("detail");

  // 취소 폼 상태
  const [cancelType, setCancelType] = useState<"full" | "partial">("full");
  const [cancelReason, setCancelReason] = useState("");
  const [refundBank, setRefundBank] = useState("");
  const [refundAccount, setRefundAccount] = useState("");
  const [refundName, setRefundName] = useState("");
  const [cancelItems, setCancelItems] = useState<Record<number, number>>({});

  // 반품 폼 상태
  const [returnType, setReturnType] = useState<"full" | "partial">("full");
  const [returnReason, setReturnReason] = useState("");
  const [returnItems, setReturnItems] = useState<Record<number, number>>({});

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ESC 키 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // view 전환 시 오류/성공 초기화
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setFormError("");
      setFormSuccess("");
    });
    return () => cancelAnimationFrame(id);
  }, [view]);

  const totalQty = order.order_items.reduce((sum, i) => sum + i.quantity, 0);

  // 취소 가능 여부
  const canCancel =
    ["pending", "paid", "preparing"].includes(order.status) &&
    !order.cancel_request;
  // 반품 가능 여부
  const canReturn =
    ["shipping", "delivered"].includes(order.status) && !order.return_request;
  // 취소 요청 철회 가능 여부 (상품준비중 + 취소접수 상태일 때만)
  const canWithdrawCancel =
    order.status === "preparing" &&
    order.cancel_request?.status === "requested";
  // 반품 요청 철회 가능 여부 (반품 접수 상태일 때만)
  const canWithdrawReturn =
    order.return_request?.status === "requested";

  // 취소 제출
  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (order.status === "pending" && !refundBank) {
      setFormError("환불 받으실 은행을 선택해 주세요.");
      return;
    }
    if (order.status === "pending" && !refundAccount.trim()) {
      setFormError("환불 계좌번호를 입력해 주세요.");
      return;
    }
    if (order.status === "pending" && !refundName.trim()) {
      setFormError("예금주명을 입력해 주세요.");
      return;
    }
    if (cancelType === "partial") {
      const hasItems = Object.values(cancelItems).some((q) => q > 0);
      if (!hasItems) {
        setFormError("취소할 상품을 1개 이상 선택해 주세요.");
        return;
      }
    }

    const fd = new FormData();
    fd.set("orderId", String(order.id));
    fd.set("type", cancelType);
    fd.set("reason", cancelReason);
    if (order.status === "pending") {
      fd.set("refundBank", refundBank);
      fd.set("refundAccountNumber", refundAccount);
      fd.set("refundAccountName", refundName);
    }
    if (cancelType === "partial") {
      const items = Object.entries(cancelItems)
        .filter(([, q]) => q > 0)
        .map(([id, quantity]) => ({ order_item_id: Number(id), quantity }));
      fd.set("items", JSON.stringify(items));
    }

    startTransition(async () => {
      try {
        await createCancelRequest(fd);
        const msg =
          order.status === "preparing"
            ? "취소 요청이 접수되었습니다. 관리자 검토 후 처리됩니다."
            : "주문이 취소되었습니다.";
        setFormSuccess(msg);
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1800);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "취소 요청에 실패했습니다.",
        );
      }
    });
  }

  // 반품 제출
  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (returnType === "partial") {
      const hasItems = Object.values(returnItems).some((q) => q > 0);
      if (!hasItems) {
        setFormError("반품할 상품을 1개 이상 선택해 주세요.");
        return;
      }
    }
    if (!returnReason.trim()) {
      setFormError("반품 사유를 입력해 주세요.");
      return;
    }

    const fd = new FormData();
    fd.set("orderId", String(order.id));
    fd.set("type", returnType);
    fd.set("reason", returnReason);
    if (returnType === "partial") {
      const items = Object.entries(returnItems)
        .filter(([, q]) => q > 0)
        .map(([id, quantity]) => ({ order_item_id: Number(id), quantity }));
      fd.set("items", JSON.stringify(items));
    }

    startTransition(async () => {
      try {
        await createReturnRequest(fd);
        setFormSuccess("반품 요청이 접수되었습니다. 상품 수거 후 처리됩니다.");
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1800);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "반품 요청에 실패했습니다.",
        );
      }
    });
  }

  // 취소 요청 철회 제출
  function handleCancelWithdraw() {
    if (!order.cancel_request) return;
    setFormError("");
    startTransition(async () => {
      try {
        await requestCancelWithdrawal(order.cancel_request!.id);
        setFormSuccess("철회 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.");
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1800);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "철회 요청에 실패했습니다.",
        );
      }
    });
  }

  // 반품 요청 철회 제출
  function handleReturnWithdraw() {
    if (!order.return_request) return;
    setFormError("");
    startTransition(async () => {
      try {
        await requestReturnWithdrawal(order.return_request!.id);
        setFormSuccess("철회 요청이 접수되었습니다. 관리자 확인 후 처리됩니다.");
        setTimeout(() => {
          router.refresh();
          onClose();
        }, 1800);
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "철회 요청에 실패했습니다.",
        );
      }
    });
  }

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
          <div className="mb-3 flex justify-center sm:hidden">
            <div className="h-1 w-10 rounded-full bg-[#E8E6E1]" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {view !== "detail" && (
                <button
                  type="button"
                  onClick={() => setView("detail")}
                  className="mb-1.5 flex items-center gap-1 text-xs text-[#9ca3af] hover:text-[#5332C9] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  주문 상세로
                </button>
              )}
              <div className="mb-1.5 flex items-center gap-2">
                <StatusBadge status={order.status} />
                {view === "cancel" && (
                  <span className="text-xs font-bold text-[#c2410c]">
                    취소 신청
                  </span>
                )}
                {view === "return" && (
                  <span className="text-xs font-bold text-[#1d4ed8]">
                    반품 신청
                  </span>
                )}
                {view === "cancel-withdraw" && (
                  <span className="text-xs font-bold text-[#92400e]">
                    취소 요청 철회
                  </span>
                )}
                {view === "return-withdraw" && (
                  <span className="text-xs font-bold text-[#92400e]">
                    반품 요청 철회
                  </span>
                )}
              </div>
              <p className="text-base font-bold leading-tight text-[#222222]">
                주문번호 {order.order_number}
              </p>
              <p className="mt-0.5 text-xs text-[#9ca3af]">
                {fmtDateTime(order.created_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#FAF9F6]"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {view === "detail" && (
            <div className="mt-4 px-1">
              <OrderTimeline status={order.status} />
            </div>
          )}
        </div>

        <div className="h-px flex-none bg-[#E8E6E1]" />

        {/* ── 스크롤 영역 ── */}
        <div className="flex-1 overflow-y-auto">
          {/* ──────────── 상세 뷰 ──────────── */}
          {view === "detail" && (
            <div className="space-y-6 px-5 py-5">
              {/* 취소/반품 요청 상태 표시 */}
              {order.cancel_request && (
                <section>
                  <div className="rounded-2xl border border-[#E8E6E1] bg-[#f9fafb] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#222222]">
                        취소 요청 현황
                      </p>
                      <CancelStatusBadge status={order.cancel_request.status} />
                    </div>
                    <CancelProgressBar status={order.cancel_request.status} />
                    {order.cancel_request.status === "requested" && (
                      <p className="mt-3 text-xs text-[#6b7280]">
                        {order.status === "preparing"
                          ? "관리자가 확인 후 처리 예정입니다. 출고 전이라면 취소가 승인됩니다."
                          : "취소 요청이 접수되었습니다."}
                      </p>
                    )}
                    {order.cancel_request.reason && (
                      <p className="mt-2 text-xs text-[#9ca3af]">
                        사유: {order.cancel_request.reason}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {order.return_request && (
                <section>
                  <div className="rounded-2xl border border-[#E8E6E1] bg-[#f9fafb] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#222222]">
                        반품 요청 현황
                      </p>
                      <ReturnStatusBadge status={order.return_request.status} />
                    </div>
                    <ReturnProgressBar status={order.return_request.status} />
                    {order.return_request.status === "requested" && (
                      <p className="mt-3 text-xs text-[#6b7280]">
                        반품 요청이 접수되었습니다. 수거 기사가 방문 예정입니다.
                      </p>
                    )}
                    {order.return_request.status === "picked_up" && (
                      <p className="mt-3 text-xs text-[#6b7280]">
                        상품이 수거되었습니다. 검수 완료 후 환불 처리됩니다.
                      </p>
                    )}
                    {order.return_request.reason && (
                      <p className="mt-2 text-xs text-[#9ca3af]">
                        사유: {order.return_request.reason}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* 섹션 1 – 주문 상품 */}
              <section>
                <SectionTitle
                  num={1}
                  title="주문 상품"
                  sub={`총 ${totalQty}개`}
                />
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
                          {item.price_snapshot.toLocaleString()}원 ×{" "}
                          {item.quantity}개
                        </p>
                      </div>
                      <p className="flex-none text-sm font-bold text-[#222222]">
                        {(item.price_snapshot * item.quantity).toLocaleString()}
                        원
                      </p>
                    </div>
                  ))}
                </div>
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
                    <InfoRow
                      label="연락처 2"
                      value={order.recipient_phone_extra}
                    />
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
                    <InfoRow
                      label="주문자 연락처"
                      value={order.orderer_phone}
                    />
                  )}
                  {order.orderer_email && (
                    <InfoRow label="이메일" value={order.orderer_email} />
                  )}
                </div>
              </section>

              {/* 배송 중 반품 안내 */}
              {order.status === "shipping" && !order.return_request && (
                <section>
                  <ReturnInfoBanner status="shipping" />
                </section>
              )}

              {/* 배송 완료 반품 안내 */}
              {order.status === "delivered" && !order.return_request && (
                <section>
                  <ReturnInfoBanner status="delivered" />
                </section>
              )}

              <div className="pb-2" />
            </div>
          )}

          {/* ──────────── 취소 신청 뷰 ──────────── */}
          {view === "cancel" && (
            <form onSubmit={handleCancelSubmit} className="space-y-5 px-5 py-5">
              <CancelInfoBanner status={order.status} />

              {/* 취소 유형 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-[#6b7280]">
                  취소 유형
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "full", label: "전체 취소" },
                      { value: "partial", label: "부분 취소" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        cancelType === opt.value
                          ? "border-[#5332C9] bg-[#ede9fb] text-[#5332C9]"
                          : "border-[#E8E6E1] bg-white text-[#6b7280]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelType"
                        value={opt.value}
                        checked={cancelType === opt.value}
                        onChange={() => {
                          setCancelType(opt.value);
                          setCancelItems({});
                        }}
                        className="hidden"
                      />
                      {cancelType === opt.value ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5332C9]">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="h-4 w-4 rounded-full border-2 border-[#E8E6E1]" />
                      )}
                      <span className="font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 부분 취소: 상품 선택 */}
              {cancelType === "partial" && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#6b7280]">
                    취소할 상품 선택
                  </p>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-[#222222]">
                          {item.product_name_snapshot}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-xs text-[#9ca3af]">
                            {item.price_snapshot.toLocaleString()}원 · 최대{" "}
                            {item.quantity}개
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCancelItems((p) => ({
                                  ...p,
                                  [item.id]: Math.max(0, (p[item.id] ?? 0) - 1),
                                }))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E6E1] bg-white text-[#6b7280] hover:bg-[#FAF9F6]"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-[#222222]">
                              {cancelItems[item.id] ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setCancelItems((p) => ({
                                  ...p,
                                  [item.id]: Math.min(
                                    item.quantity,
                                    (p[item.id] ?? 0) + 1,
                                  ),
                                }))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E6E1] bg-white text-[#6b7280] hover:bg-[#FAF9F6]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 환불 계좌 (입금 대기 시) */}
              {order.status === "pending" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#6b7280]">
                    환불 계좌 정보 <span className="text-[#FF5555]">*</span>
                  </p>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#9ca3af]">
                      은행
                    </label>
                    <select
                      value={refundBank}
                      onChange={(e) => setRefundBank(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-2 focus:ring-[#5332C9]/15"
                    >
                      <option value="">은행 선택</option>
                      {KOREAN_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#9ca3af]">
                      계좌번호
                    </label>
                    <input
                      type="text"
                      value={refundAccount}
                      onChange={(e) => setRefundAccount(e.target.value)}
                      placeholder="- 없이 숫자만 입력"
                      className="w-full rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-2 focus:ring-[#5332C9]/15"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-[#9ca3af]">
                      예금주명
                    </label>
                    <input
                      type="text"
                      value={refundName}
                      onChange={(e) => setRefundName(e.target.value)}
                      placeholder="통장 명의자 이름"
                      className="w-full rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-2 focus:ring-[#5332C9]/15"
                    />
                  </div>
                </div>
              )}

              {/* 취소 사유 */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                  취소 사유 (선택)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="취소 사유를 입력해 주세요."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-2 focus:ring-[#5332C9]/15"
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#FF5555]">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-semibold text-[#15803d]">
                  ✅ {formSuccess}
                </div>
              )}

              <div className="flex gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setView("detail")}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-3 text-sm font-medium text-[#6b7280] hover:bg-[#FAF9F6] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending || !!formSuccess}
                  className="flex-1 rounded-xl bg-[#c2410c] py-3 text-sm font-bold text-white hover:bg-[#9a3412] disabled:opacity-50 transition-colors"
                >
                  {isPending
                    ? "처리 중..."
                    : order.status === "preparing"
                      ? "취소 요청 접수"
                      : "취소 확인"}
                </button>
              </div>
            </form>
          )}

          {/* ──────────── 반품 신청 뷰 ──────────── */}
          {view === "return" && (
            <form onSubmit={handleReturnSubmit} className="space-y-5 px-5 py-5">
              <ReturnInfoBanner status={order.status} />

              {/* 반품 유형 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-[#6b7280]">
                  반품 유형
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "full", label: "전체 반품" },
                      { value: "partial", label: "부분 반품" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        returnType === opt.value
                          ? "border-[#5332C9] bg-[#ede9fb] text-[#5332C9]"
                          : "border-[#E8E6E1] bg-white text-[#6b7280]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="returnType"
                        value={opt.value}
                        checked={returnType === opt.value}
                        onChange={() => {
                          setReturnType(opt.value);
                          setReturnItems({});
                        }}
                        className="hidden"
                      />
                      {returnType === opt.value ? (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5332C9]">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                      ) : (
                        <span className="h-4 w-4 rounded-full border-2 border-[#E8E6E1]" />
                      )}
                      <span className="font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 부분 반품: 상품 선택 */}
              {returnType === "partial" && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#6b7280]">
                    반품할 상품 선택
                  </p>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-[#222222]">
                          {item.product_name_snapshot}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-xs text-[#9ca3af]">
                            {item.price_snapshot.toLocaleString()}원 · 최대{" "}
                            {item.quantity}개
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setReturnItems((p) => ({
                                  ...p,
                                  [item.id]: Math.max(0, (p[item.id] ?? 0) - 1),
                                }))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E6E1] bg-white text-[#6b7280] hover:bg-[#FAF9F6]"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-[#222222]">
                              {returnItems[item.id] ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setReturnItems((p) => ({
                                  ...p,
                                  [item.id]: Math.min(
                                    item.quantity,
                                    (p[item.id] ?? 0) + 1,
                                  ),
                                }))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E8E6E1] bg-white text-[#6b7280] hover:bg-[#FAF9F6]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 반품 사유 */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                  반품 사유 <span className="text-[#FF5555]">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="반품 사유를 입력해 주세요. (예: 단순 변심, 상품 불량, 오배송 등)"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-2 focus:ring-[#5332C9]/15"
                />
              </div>

              {/* 반품비 안내 */}
              <div className="rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3 text-xs text-[#6b7280]">
                <p className="font-semibold text-[#222222] mb-1">
                  반품 배송비 안내
                </p>
                <p>
                  단순 변심: <strong>{RETURN_SHIPPING_FEE}</strong> 고객 부담
                </p>
                <p>
                  상품 불량·오배송:{" "}
                  <strong className="text-[#15803d]">무료</strong> (판매자 부담)
                </p>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#FF5555]">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-semibold text-[#15803d]">
                  ✅ {formSuccess}
                </div>
              )}

              <div className="flex gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setView("detail")}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-3 text-sm font-medium text-[#6b7280] hover:bg-[#FAF9F6] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending || !!formSuccess}
                  className="flex-1 rounded-xl bg-[#1d4ed8] py-3 text-sm font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50 transition-colors"
                >
                  {isPending ? "처리 중..." : "반품 신청"}
                </button>
              </div>
            </form>
          )}

          {/* ──────────── 취소 요청 철회 뷰 ──────────── */}
          {view === "cancel-withdraw" && (
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-2xl border border-[#fef08a] bg-[#fefce8] p-4">
                <p className="text-sm font-bold text-[#92400e] mb-2">
                  ⚠️ 취소 요청을 철회하시겠습니까?
                </p>
                <p className="text-xs text-[#92400e] leading-relaxed">
                  철회 요청은 관리자 확인 후 처리됩니다. 관리자가 이미 취소를
                  처리하고 있다면 철회가 불가할 수 있습니다.
                </p>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#FF5555]">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-semibold text-[#15803d]">
                  ✅ {formSuccess}
                </div>
              )}

              <div className="flex gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setView("detail")}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-3 text-sm font-medium text-[#6b7280] hover:bg-[#FAF9F6] transition-colors"
                >
                  돌아가기
                </button>
                <button
                  type="button"
                  disabled={isPending || !!formSuccess}
                  onClick={handleCancelWithdraw}
                  className="flex-1 rounded-xl bg-[#92400e] py-3 text-sm font-bold text-white hover:bg-[#78350f] disabled:opacity-50 transition-colors"
                >
                  {isPending ? "처리 중..." : "철회 요청"}
                </button>
              </div>
            </div>
          )}

          {/* ──────────── 반품 요청 철회 뷰 ──────────── */}
          {view === "return-withdraw" && (
            <div className="space-y-4 px-5 py-5">
              <div className="rounded-2xl border border-[#fef08a] bg-[#fefce8] p-4">
                <p className="text-sm font-bold text-[#92400e] mb-2">
                  ⚠️ 반품 요청을 철회하시겠습니까?
                </p>
                <p className="text-xs text-[#92400e] leading-relaxed">
                  철회 요청은 관리자 확인 후 처리됩니다. 수거 기사가 이미
                  배차된 경우 철회가 불가할 수 있습니다.
                </p>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-[#FF5555]">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-semibold text-[#15803d]">
                  ✅ {formSuccess}
                </div>
              )}

              <div className="flex gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setView("detail")}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-3 text-sm font-medium text-[#6b7280] hover:bg-[#FAF9F6] transition-colors"
                >
                  돌아가기
                </button>
                <button
                  type="button"
                  disabled={isPending || !!formSuccess}
                  onClick={handleReturnWithdraw}
                  className="flex-1 rounded-xl bg-[#92400e] py-3 text-sm font-bold text-white hover:bg-[#78350f] disabled:opacity-50 transition-colors"
                >
                  {isPending ? "처리 중..." : "철회 요청"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 하단 액션 바 (상세 뷰에서만) ── */}
        {view === "detail" &&
          (canCancel || canReturn || canWithdrawCancel || canWithdrawReturn) && (
          <div className="flex-none border-t border-[#E8E6E1] bg-white px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {canCancel && (
                <button
                  type="button"
                  onClick={() => setView("cancel")}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-semibold text-[#c2410c] hover:border-[#c2410c]/30 hover:bg-orange-50 transition-colors"
                >
                  취소 신청
                </button>
              )}
              {canReturn && (
                <button
                  type="button"
                  onClick={() => setView("return")}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-semibold text-[#1d4ed8] hover:border-[#1d4ed8]/30 hover:bg-blue-50 transition-colors"
                >
                  반품 신청
                </button>
              )}
              {canWithdrawCancel && (
                <button
                  type="button"
                  onClick={() => setView("cancel-withdraw")}
                  className="flex-1 rounded-xl border border-[#fef08a] py-2.5 text-sm font-semibold text-[#92400e] hover:bg-[#fefce8] transition-colors"
                >
                  취소 요청 철회
                </button>
              )}
              {canWithdrawReturn && (
                <button
                  type="button"
                  onClick={() => setView("return-withdraw")}
                  className="flex-1 rounded-xl border border-[#fef08a] py-2.5 text-sm font-semibold text-[#92400e] hover:bg-[#fefce8] transition-colors"
                >
                  반품 요청 철회
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── 주문 카드 ──────────────────────────────────────────────────────────
function OrderCard({
  order,
  onClick,
}: {
  order: MyOrder;
  onClick: () => void;
}) {
  const firstItem = order.order_items[0];
  const extraCount = order.order_items.length - 1;
  const hasCancelReq =
    order.cancel_request && order.cancel_request.status !== "completed";
  const hasReturnReq = !!order.return_request;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-[#E8E6E1] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#5332C9]/20 hover:shadow-md active:scale-[0.99]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-[#9ca3af]">
          {fmtDate(order.created_at)}
        </span>
        <div className="flex items-center gap-1.5">
          {hasCancelReq && (
            <CancelStatusBadge status={order.cancel_request!.status} />
          )}
          {hasReturnReq && (
            <ReturnStatusBadge status={order.return_request!.status} />
          )}
          {!hasCancelReq && !hasReturnReq && (
            <StatusBadge status={order.status} />
          )}
        </div>
      </div>
      <div className="mb-3">
        <p className="line-clamp-1 text-sm font-semibold text-[#222222]">
          {firstItem?.product_name_snapshot ?? "상품명 없음"}
          {extraCount > 0 && (
            <span className="ml-1 text-xs font-normal text-[#9ca3af]">
              외 {extraCount}건
            </span>
          )}
        </p>
        <p className="mt-0.5 font-mono text-xs text-[#9ca3af]">
          {order.order_number}
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-[#F3F2EE] pt-3">
        <p className="text-base font-black text-[#222222]">
          {order.total_amount.toLocaleString()}
          <span className="ml-0.5 text-sm font-normal text-[#6b7280]">원</span>
        </p>
        <div className="flex items-center gap-1 text-xs font-medium text-[#9ca3af] transition-colors group-hover:text-[#5332C9]">
          상세 보기
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
            i.product_name_snapshot.toLowerCase().includes(q),
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
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="min-w-0 flex-1 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
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
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="flex-none rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-xs font-medium text-[#6b7280] outline-none transition-colors hover:border-[#5332C9]/30 focus:border-[#5332C9]"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[#9ca3af]">
            {filtered.length > 0 && (
              <>
                총{" "}
                <span className="font-semibold text-[#222222]">
                  {filtered.length}건
                </span>
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
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
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
