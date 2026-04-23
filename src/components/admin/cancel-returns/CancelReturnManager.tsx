"use client";

import { useState, useTransition, useEffect } from "react";
import type {
  AdminCancelRequest,
  AdminReturnRequest,
} from "@/src/server/admin-cancel-return";
import {
  approveCancelRequest,
  rejectCancelRequest,
  approveCancelWithdraw,
  rejectCancelWithdraw,
  approveReturnRequest,
  rejectReturnRequest,
  approveReturnWithdraw,
  rejectReturnWithdraw,
  deleteCancelMemo,
  deleteReturnMemo,
} from "@/src/server/admin-cancel-return";

// ── 타입 ────────────────────────────────────────────────────────────────
type Tab =
  | "all"
  | "cancel_req"
  | "cancel_withdraw"
  | "return_req"
  | "return_withdraw";
type ActionMode = "approve" | "reject";

type ModalItem =
  | { kind: "cancel"; data: AdminCancelRequest }
  | { kind: "return"; data: AdminReturnRequest };

// ── 상수 ────────────────────────────────────────────────────────────────
const TAB_CONFIG: { value: Tab; label: string; dot?: string }[] = [
  { value: "all", label: "전체" },
  { value: "cancel_req", label: "취소요청", dot: "bg-orange-400" },
  { value: "cancel_withdraw", label: "취소철회요청", dot: "bg-[#D4AF37]" },
  { value: "return_req", label: "반품요청", dot: "bg-blue-400" },
  { value: "return_withdraw", label: "반품철회요청", dot: "bg-[#D4AF37]" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  requested: {
    label: "취소 접수",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
  },
  completed: {
    label: "취소 완료",
    cls: "bg-[#f9fafb] text-[#6b7280] border-gray-200",
  },
  rejected: {
    label: "취소 거절",
    cls: "bg-red-50 text-[#FF5555] border-red-200",
  },
  withdraw_requested: {
    label: "철회 요청 중",
    cls: "bg-[#fefce8] text-[#92400e] border-[#fef08a]",
  },
  withdraw_completed: {
    label: "철회 완료",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  picked_up: {
    label: "수거 중",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

const RETURN_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  requested: {
    label: "반품 접수",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
  },
  picked_up: {
    label: "수거 중",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    label: "반품 완료",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: {
    label: "반품 거절",
    cls: "bg-red-50 text-[#FF5555] border-red-200",
  },
  withdraw_requested: {
    label: "철회 요청 중",
    cls: "bg-[#fefce8] text-[#92400e] border-[#fef08a]",
  },
  withdraw_completed: {
    label: "철회 완료",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
};

// ── 유틸 ────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isActionable(status: string) {
  return status === "requested" || status === "withdraw_requested";
}

// ── 상태 뱃지 컴포넌트 ─────────────────────────────────────────────────
function StatusBadge({
  status,
  isReturn = false,
}: {
  status: string;
  isReturn?: boolean;
}) {
  const map = isReturn ? RETURN_STATUS_BADGE : STATUS_BADGE;
  const cfg = map[status] ?? {
    label: status,
    cls: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Props ────────────────────────────────────────────────────────────────
type Props = {
  cancelRequests: AdminCancelRequest[];
  returnRequests: AdminReturnRequest[];
  initialTab?: Tab;
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────
export default function CancelReturnManager({
  cancelRequests,
  returnRequests,
  initialTab = "all",
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, setSelected] = useState<ModalItem | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode | null>(null);
  const [adminMemo, setAdminMemo] = useState("");
  const [customerNotice, setCustomerNotice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 모달 닫힐 때 상태 초기화
  function closeModal() {
    setSelected(null);
    setActionMode(null);
    setAdminMemo("");
    setCustomerNotice("");
    setError("");
    setSuccess("");
    setDeleteConfirm(false);
  }

  // 모달 열릴 때 body 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  // ESC 키 닫기
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 탭별 필터링 ────────────────────────────────────────────────────────
  const filteredCancel = cancelRequests.filter((r) => {
    if (tab === "cancel_req") return r.status === "requested";
    if (tab === "cancel_withdraw") return r.status === "withdraw_requested";
    if (tab === "return_req" || tab === "return_withdraw") return false;
    return true;
  });

  const filteredReturn = returnRequests.filter((r) => {
    if (tab === "return_req") return r.status === "requested";
    if (tab === "return_withdraw") return r.status === "withdraw_requested";
    if (tab === "cancel_req" || tab === "cancel_withdraw") return false;
    return true;
  });

  // 탭 카운트
  const counts: Record<Tab, number> = {
    all: cancelRequests.length + returnRequests.length,
    cancel_req: cancelRequests.filter((r) => r.status === "requested").length,
    cancel_withdraw: cancelRequests.filter(
      (r) => r.status === "withdraw_requested",
    ).length,
    return_req: returnRequests.filter((r) => r.status === "requested").length,
    return_withdraw: returnRequests.filter(
      (r) => r.status === "withdraw_requested",
    ).length,
  };

  // ── 승인/거절 제출 ────────────────────────────────────────────────────
  function handleSubmit() {
    if (!selected || !actionMode) return;
    const isReject = actionMode === "reject";

    if (isReject && !customerNotice.trim()) {
      setError("고객 안내문구를 입력해 주세요.");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const memo = adminMemo.trim() || null;
        const notice = customerNotice.trim();

        if (selected.kind === "cancel") {
          const { status } = selected.data;
          if (status === "requested") {
            if (actionMode === "approve")
              await approveCancelRequest(selected.data.id, memo);
            else await rejectCancelRequest(selected.data.id, adminMemo, notice);
          } else if (status === "withdraw_requested") {
            if (actionMode === "approve")
              await approveCancelWithdraw(selected.data.id, memo);
            else
              await rejectCancelWithdraw(selected.data.id, adminMemo, notice);
          }
        } else {
          const { status } = selected.data;
          if (status === "requested") {
            if (actionMode === "approve")
              await approveReturnRequest(selected.data.id, memo);
            else await rejectReturnRequest(selected.data.id, adminMemo, notice);
          } else if (status === "withdraw_requested") {
            if (actionMode === "approve")
              await approveReturnWithdraw(selected.data.id, memo);
            else
              await rejectReturnWithdraw(selected.data.id, adminMemo, notice);
          }
        }

        setSuccess(
          actionMode === "approve"
            ? "승인 처리되었습니다."
            : "거절 처리되었습니다.",
        );
        setTimeout(() => closeModal(), 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
      }
    });
  }

  // ── 메모 삭제 ─────────────────────────────────────────────────────────
  function handleDeleteMemo() {
    if (!selected) return;
    startTransition(async () => {
      try {
        if (selected.kind === "cancel")
          await deleteCancelMemo(selected.data.id);
        else await deleteReturnMemo(selected.data.id);
        setDeleteConfirm(false);
        setSuccess("메모가 삭제되었습니다.");
        setTimeout(() => closeModal(), 1200);
      } catch {
        setError("메모 삭제에 실패했습니다.");
        setDeleteConfirm(false);
      }
    });
  }

  // ── 현재 선택된 아이템의 최신 데이터 (낙관적 렌더를 위해 목록에서 찾음) ─
  // (revalidatePath 후 server re-fetch 되므로 selected는 ref로만 사용)
  const hasMemo = selected
    ? !!(selected.data.admin_memo || selected.data.customer_notice)
    : false;

  const actionable = selected ? isActionable(selected.data.status) : false;

  // 승인/거절 라벨 결정
  function getActionLabels() {
    if (!selected) return { approve: "승인", reject: "거절" };
    const { status } = selected.data;
    if (status === "withdraw_requested") {
      return { approve: "철회 승인", reject: "철회 거절" };
    }
    return { approve: "승인", reject: "거절 (철회)" };
  }
  const labels = getActionLabels();

  return (
    <>
      {/* ── 탭 ─────────────────────────────────────────────────────────── */}
      <div
        className="flex gap-1 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {TAB_CONFIG.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`relative flex-none rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              tab === t.value
                ? "bg-[#5332C9] text-white shadow-sm"
                : "border border-[#E8E6E1] bg-white text-[#6b7280] hover:border-[#5332C9]/30 hover:text-[#5332C9]"
            }`}
          >
            {t.label}
            {counts[t.value] > 0 && (
              <span
                className={`ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  tab === t.value
                    ? "bg-white/25 text-white"
                    : "bg-[#FF5555] text-white"
                }`}
              >
                {counts[t.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 목록 ────────────────────────────────────────────────────────── */}
      {filteredCancel.length === 0 && filteredReturn.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#E8E6E1] bg-white py-16 text-center">
          <span className="text-3xl">📋</span>
          <p className="text-sm font-semibold text-[#222222]">
            처리할 요청이 없습니다
          </p>
          <p className="text-xs text-[#9ca3af]">
            새로운 요청이 들어오면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white">
          {/* 테이블 헤더 */}
          <div className="hidden grid-cols-[80px_1fr_100px_120px_90px] gap-4 border-b border-[#E8E6E1] bg-[#FAF9F6] px-5 py-3 text-xs font-semibold text-[#6b7280] sm:grid">
            <div>유형</div>
            <div>주문 정보</div>
            <div>사유</div>
            <div>요청일</div>
            <div>상태</div>
          </div>

          <div className="divide-y divide-[#E8E6E1]">
            {/* 취소 요청 행 */}
            {filteredCancel.map((req) => (
              <button
                key={`c-${req.id}`}
                type="button"
                onClick={() => {
                  setSelected({ kind: "cancel", data: req });
                  setActionMode(null);
                }}
                className="w-full px-5 py-3.5 text-left transition-colors hover:bg-[#FAF9F6]"
              >
                {/* 모바일 */}
                <div className="flex items-start justify-between gap-2 sm:hidden">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                        {req.status === "withdraw_requested"
                          ? "취소철회"
                          : "취소요청"}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="truncate text-xs font-semibold text-[#222222]">
                      {req.orders?.[0]?.order_number}
                    </p>

                    <p className="text-xs text-[#6b7280]">
                      {req.orders?.[0]?.orderer_name ??
                        req.orders?.[0]?.recipient_name}
                    </p>
                    {req.reason && (
                      <p className="truncate text-[11px] text-[#9ca3af]">
                        {req.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex-none text-right">
                    <p className="text-xs font-bold text-[#222222]">
                      {req.orders?.[0]?.total_amount?.toLocaleString()}원
                    </p>
                    <p className="text-[11px] text-[#9ca3af]">
                      {fmtDate(req.created_at)}
                    </p>
                  </div>
                </div>

                {/* PC */}
                <div className="hidden sm:grid sm:grid-cols-[80px_1fr_100px_120px_90px] sm:items-center sm:gap-4">
                  <div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${req.status === "withdraw_requested" ? "bg-[#fefce8] text-[#92400e] border-[#fef08a]" : "bg-orange-50 text-orange-700 border-orange-200"}`}
                    >
                      {req.status === "withdraw_requested"
                        ? "취소철회"
                        : "취소요청"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#222222]">
                      {req.orders?.[0]?.order_number}
                    </p>

                    <p className="text-xs text-[#6b7280]">
                      {req.orders?.[0]?.orderer_name ??
                        req.orders?.[0]?.recipient_name}{" "}
                      ·{req.orders?.[0]?.total_amount?.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    {req.reason ? (
                      <p className="truncate text-xs text-[#6b7280]">
                        {req.reason.slice(0, 20)}
                        {req.reason.length > 20 ? "…" : ""}
                      </p>
                    ) : (
                      <span className="text-xs text-[#d1d5db]">-</span>
                    )}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    {fmtDateTime(req.created_at)}
                  </div>
                  <div>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              </button>
            ))}

            {/* 반품 요청 행 */}
            {filteredReturn.map((req) => (
              <button
                key={`r-${req.id}`}
                type="button"
                onClick={() => {
                  setSelected({ kind: "return", data: req });
                  setActionMode(null);
                }}
                className="w-full px-5 py-3.5 text-left transition-colors hover:bg-[#FAF9F6]"
              >
                {/* 모바일 */}
                <div className="flex items-start justify-between gap-2 sm:hidden">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${req.status === "withdraw_requested" ? "bg-[#fefce8] text-[#92400e] border-[#fef08a]" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                      >
                        {req.status === "withdraw_requested"
                          ? "반품철회"
                          : "반품요청"}
                      </span>
                      <StatusBadge status={req.status} isReturn />
                    </div>
                    <p className="truncate text-xs font-semibold text-[#222222]">
                      {req.orders?.[0]?.order_number}
                    </p>
                    <p className="text-xs text-[#6b7280]">
                      {req.orders?.[0]?.orderer_name ??
                        req.orders?.[0]?.recipient_name}
                    </p>
                    {req.reason && (
                      <p className="truncate text-[11px] text-[#9ca3af]">
                        {req.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex-none text-right">
                    <p className="text-xs font-bold text-[#222222]">
                      {req.orders?.[0]?.total_amount?.toLocaleString()}원
                    </p>
                    <p className="text-[11px] text-[#9ca3af]">
                      {fmtDate(req.created_at)}
                    </p>
                  </div>
                </div>

                {/* PC */}
                <div className="hidden sm:grid sm:grid-cols-[80px_1fr_100px_120px_90px] sm:items-center sm:gap-4">
                  <div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${req.status === "withdraw_requested" ? "bg-[#fefce8] text-[#92400e] border-[#fef08a]" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                    >
                      {req.status === "withdraw_requested"
                        ? "반품철회"
                        : "반품요청"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#222222]">
                      {req.orders?.[0]?.order_number}
                    </p>
                    <p className="text-xs text-[#6b7280]">
                      {req.orders?.[0]?.orderer_name ??
                        req.orders?.[0]?.recipient_name}{" "}
                      · {req.orders?.[0]?.total_amount?.toLocaleString()}원
                    </p>
                  </div>
                  <div>
                    {req.reason ? (
                      <p className="truncate text-xs text-[#6b7280]">
                        {req.reason.slice(0, 20)}
                        {req.reason.length > 20 ? "…" : ""}
                      </p>
                    ) : (
                      <span className="text-xs text-[#d1d5db]">-</span>
                    )}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    {fmtDateTime(req.created_at)}
                  </div>
                  <div>
                    <StatusBadge status={req.status} isReturn />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 상세 모달 ────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center sm:justify-center">
          {/* 배경 딤 */}
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          {/* 패널 */}
          <div className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl">
            {/* 핸들 바 (모바일) */}
            <div className="flex-none px-5 pt-4">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E6E1] sm:hidden" />

              {/* 헤더 */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        selected.kind === "cancel"
                          ? selected.data.status === "withdraw_requested"
                            ? "bg-[#fefce8] text-[#92400e] border-[#fef08a]"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                          : selected.data.status === "withdraw_requested"
                            ? "bg-[#fefce8] text-[#92400e] border-[#fef08a]"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {selected.kind === "cancel"
                        ? selected.data.status === "withdraw_requested"
                          ? "취소 철회요청"
                          : "취소 요청"
                        : selected.data.status === "withdraw_requested"
                          ? "반품 철회요청"
                          : "반품 요청"}
                    </span>
                    <StatusBadge
                      status={selected.data.status}
                      isReturn={selected.kind === "return"}
                    />
                  </div>
                  <p className="text-sm font-bold text-[#222222]">
                    {selected.data.orders?.[0]?.order_number}
                  </p>
                  <p className="text-xs text-[#9ca3af]">
                    {fmtDateTime(selected.data.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[#6b7280] hover:bg-[#FAF9F6]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-4 h-px flex-none bg-[#E8E6E1]" />

            {/* 스크롤 본문 */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 px-5 py-5">
                {/* 주문 정보 */}
                <section className="rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] p-4 space-y-1.5">
                  <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-2">
                    주문 정보
                  </p>
                  <Row
                    label="주문자"
                    value={
                      selected.data.orders?.[0]?.orderer_name ??
                      selected.data.orders?.[0]?.recipient_name ??
                      "-"
                    }
                  />
                  <Row
                    label="수령인"
                    value={selected.data.orders?.[0]?.recipient_name ?? "-"}
                  />
                  <Row
                    label="결제금액"
                    value={`${selected.data.orders?.[0]?.total_amount?.toLocaleString()}원`}
                  />
                  <Row
                    label="주문상태"
                    value={selected.data.orders?.[0]?.status ?? "-"}
                  />
                </section>

                {/* 요청 상세 */}
                <section className="rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] p-4 space-y-1.5">
                  <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-2">
                    요청 상세
                  </p>
                  <Row
                    label="요청 유형"
                    value={selected.data.type === "full" ? "전체" : "부분"}
                  />
                  {selected.data.reason && (
                    <Row label="사유" value={selected.data.reason} />
                  )}
                  {selected.kind === "cancel" && selected.data.refund_bank && (
                    <>
                      <Row
                        label="환불 은행"
                        value={selected.data.refund_bank}
                      />
                      <Row
                        label="계좌번호"
                        value={selected.data.refund_account_number ?? "-"}
                      />
                      <Row
                        label="예금주"
                        value={selected.data.refund_account_name ?? "-"}
                      />
                    </>
                  )}
                </section>

                {/* 기존 메모 (이미 처리된 경우) */}
                {hasMemo && (
                  <section className="rounded-2xl border border-[#E8E6E1] bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#222222]">
                        처리 메모
                      </p>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(true)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#FF5555] hover:bg-red-50 transition-colors"
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                        삭제
                      </button>
                    </div>
                    {selected.data.admin_memo && (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-[#6b7280]">
                          관리자 메모 (내부용)
                        </p>
                        <div className="rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2 text-xs text-[#222222]">
                          {selected.data.admin_memo}
                        </div>
                      </div>
                    )}
                    {selected.data.customer_notice && (
                      <div>
                        <p className="mb-1 text-[11px] font-semibold text-[#6b7280]">
                          고객 안내문구
                        </p>
                        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                          {selected.data.customer_notice}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* 처리 영역 */}
                {actionable && (
                  <>
                    {/* 액션 선택 버튼 */}
                    {!actionMode && !success && (
                      <section>
                        <p className="mb-2 text-xs font-bold text-[#222222]">
                          처리 선택
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActionMode("approve")}
                            className="flex-1 rounded-xl bg-[#5332C9] py-2.5 text-sm font-bold text-white hover:bg-[#4427b0] transition-colors"
                          >
                            {labels.approve}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionMode("reject")}
                            className="flex-1 rounded-xl border border-[#FF5555]/30 bg-red-50 py-2.5 text-sm font-bold text-[#FF5555] hover:bg-red-100 transition-colors"
                          >
                            {labels.reject}
                          </button>
                        </div>
                      </section>
                    )}

                    {/* 메모 폼 */}
                    {actionMode && !success && (
                      <section className="space-y-3">
                        <div
                          className={`rounded-xl border px-4 py-3 ${
                            actionMode === "approve"
                              ? "border-[#5332C9]/20 bg-[#ede9fb]"
                              : "border-[#FF5555]/20 bg-red-50"
                          }`}
                        >
                          <p
                            className={`text-xs font-bold ${actionMode === "approve" ? "text-[#5332C9]" : "text-[#FF5555]"}`}
                          >
                            {actionMode === "approve"
                              ? `✅ ${labels.approve} 처리`
                              : `❌ ${labels.reject} 처리`}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#6b7280]">
                            {actionMode === "approve"
                              ? "메모는 선택사항입니다. 입력 후 저장하면 수정할 수 없습니다."
                              : "메모와 고객 안내문구를 입력해 주세요. 저장 후 수정할 수 없습니다."}
                          </p>
                        </div>

                        {/* 관리자 메모 */}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                            관리자 메모{" "}
                            <span className="text-[#9ca3af]">
                              (내부용 · 선택)
                            </span>
                          </label>
                          <textarea
                            value={adminMemo}
                            onChange={(e) => setAdminMemo(e.target.value)}
                            placeholder="내부 처리 메모를 입력하세요..."
                            rows={2}
                            className="w-full resize-none rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-2 focus:ring-[#5332C9]/15"
                          />
                        </div>

                        {/* 고객 안내문구 (거절 시 필수) */}
                        {actionMode === "reject" && (
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                              고객 안내문구{" "}
                              <span className="text-[#FF5555]">*</span>
                              <span className="ml-1 text-[#9ca3af]">
                                (고객에게 표시됨)
                              </span>
                            </label>
                            <textarea
                              value={customerNotice}
                              onChange={(e) =>
                                setCustomerNotice(e.target.value)
                              }
                              placeholder="예) 상품 출고가 완료되어 취소가 불가합니다. 상품 수령 후 반품 신청을 이용해 주세요."
                              rows={3}
                              className="w-full resize-none rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:border-[#FF5555] focus:outline-none focus:ring-2 focus:ring-[#FF5555]/15"
                            />
                          </div>
                        )}

                        {error && (
                          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-[#FF5555]">
                            {error}
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedId(null)}
                            disabled={isPending}
                            className="flex-1 rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-semibold text-[#6b7280] transition-colors hover:border-[#9ca3af]"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="flex-1 rounded-xl bg-[#FF5555] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#e04444] disabled:opacity-60"
                          >
                            {isPending ? "처리 중..." : actionLabel}
                          </button>
                        </div>
                      </section>
                    )}

                    {success && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                        <p className="text-sm font-semibold text-emerald-700">✅ 처리가 완료되었습니다.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 하단 닫기 버튼 */}
            <div className="flex-none border-t border-[#E8E6E1] px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-xl border border-[#E8E6E1] py-2.5 text-sm font-semibold text-[#6b7280] transition-colors hover:border-[#9ca3af]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
