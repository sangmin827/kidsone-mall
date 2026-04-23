"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── 관리자 인증 헬퍼 ────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("로그인이 필요합니다.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("관리자만 접근할 수 있습니다.");
  }

  return { supabase };
}

function revalidateAll() {
  revalidatePath("/admin/cancel-returns");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/mypage/orders");
}

// ── 타입 ────────────────────────────────────────────────────────────────
export type AdminCancelRequest = {
  id: number;
  order_id: number;
  user_id: string | null;
  type: "full" | "partial";
  status:
    | "requested"
    | "completed"
    | "rejected"
    | "withdraw_requested"
    | "withdraw_completed";
  reason: string | null;
  refund_bank: string | null;
  refund_account_number: string | null;
  refund_account_name: string | null;
  admin_memo: string | null;
  customer_notice: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    order_number: string;
    orderer_name: string | null;
    recipient_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  };
};

export type AdminReturnRequest = {
  id: number;
  order_id: number;
  user_id: string | null;
  type: "full" | "partial";
  status:
    | "requested"
    | "picked_up"
    | "completed"
    | "rejected"
    | "withdraw_requested"
    | "withdraw_completed";
  reason: string | null;
  admin_memo: string | null;
  customer_notice: string | null;
  created_at: string;
  updated_at: string;
  orders: {
    order_number: string;
    orderer_name: string | null;
    recipient_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  };
};

// ── 조회 ────────────────────────────────────────────────────────────────
const CANCEL_SELECT = `
  id, order_id, user_id, type, status, reason,
  refund_bank, refund_account_number, refund_account_name,
  admin_memo, customer_notice, created_at, updated_at,
  orders (order_number, orderer_name, recipient_name, total_amount, status, created_at)
`;

const RETURN_SELECT = `
  id, order_id, user_id, type, status, reason,
  admin_memo, customer_notice, created_at, updated_at,
  orders (order_number, orderer_name, recipient_name, total_amount, status, created_at)
`;

export type CancelReturnFilter = {
  tab?: "all" | "cancel_req" | "cancel_withdraw" | "return_req" | "return_withdraw";
};

export async function getAdminCancelRequests(): Promise<AdminCancelRequest[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("cancel_requests")
    .select(CANCEL_SELECT)
    .not("status", "in", '("completed","withdraw_completed")')
    .order("created_at", { ascending: false });
  if (error) throw new Error(`취소 요청 조회 실패: ${error.message}`);
  return (data ?? []) as AdminCancelRequest[];
}

export async function getAdminReturnRequests(): Promise<AdminReturnRequest[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("return_requests")
    .select(RETURN_SELECT)
    .not("status", "in", '("completed","withdraw_completed")')
    .order("created_at", { ascending: false });
  if (error) throw new Error(`반품 요청 조회 실패: ${error.message}`);
  return (data ?? []) as AdminReturnRequest[];
}

// ── 취소 요청 승인 ────────────────────────────────────────────────────
export async function approveCancelRequest(
  cancelRequestId: number,
  adminMemo: string | null,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("cancel_requests")
    .select("order_id, status")
    .eq("id", cancelRequestId)
    .single();

  if (!req) throw new Error("취소 요청을 찾을 수 없습니다.");
  if (req.status !== "requested") throw new Error("처리할 수 없는 상태입니다.");

  // 취소 완료 처리
  await supabase
    .from("cancel_requests")
    .update({
      status: "completed",
      admin_memo: adminMemo?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cancelRequestId);

  // 주문 취소 상태로 변경
  await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", req.order_id);

  revalidateAll();
}

// ── 취소 요청 거절 (관리자 철회) ──────────────────────────────────────
export async function rejectCancelRequest(
  cancelRequestId: number,
  adminMemo: string,
  customerNotice: string,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("cancel_requests")
    .select("status")
    .eq("id", cancelRequestId)
    .single();

  if (!req) throw new Error("취소 요청을 찾을 수 없습니다.");
  if (req.status !== "requested") throw new Error("처리할 수 없는 상태입니다.");

  await supabase
    .from("cancel_requests")
    .update({
      status: "rejected",
      admin_memo: adminMemo.trim() || null,
      customer_notice: customerNotice.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cancelRequestId);

  revalidateAll();
}

// ── 취소 철회 요청 승인 ───────────────────────────────────────────────
export async function approveCancelWithdraw(
  cancelRequestId: number,
  adminMemo: string | null,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("cancel_requests")
    .select("status")
    .eq("id", cancelRequestId)
    .single();

  if (!req) throw new Error("취소 요청을 찾을 수 없습니다.");
  if (req.status !== "withdraw_requested") throw new Error("처리할 수 없는 상태입니다.");

  await supabase
    .from("cancel_requests")
    .update({
      status: "withdraw_completed",
      admin_memo: adminMemo?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cancelRequestId);

  revalidateAll();
}

// ── 취소 철회 요청 거절 ───────────────────────────────────────────────
export async function rejectCancelWithdraw(
  cancelRequestId: number,
  adminMemo: string,
  customerNotice: string,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("cancel_requests")
    .select("status")
    .eq("id", cancelRequestId)
    .single();

  if (!req) throw new Error("취소 요청을 찾을 수 없습니다.");
  if (req.status !== "withdraw_requested") throw new Error("처리할 수 없는 상태입니다.");

  // 철회 거절 → 원래 취소요청 상태로 복귀
  await supabase
    .from("cancel_requests")
    .update({
      status: "requested",
      admin_memo: adminMemo.trim() || null,
      customer_notice: customerNotice.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cancelRequestId);

  revalidateAll();
}

// ── 반품 요청 승인 ────────────────────────────────────────────────────
export async function approveReturnRequest(
  returnRequestId: number,
  adminMemo: string | null,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("return_requests")
    .select("status")
    .eq("id", returnRequestId)
    .single();

  if (!req) throw new Error("반품 요청을 찾을 수 없습니다.");
  if (req.status !== "requested") throw new Error("처리할 수 없는 상태입니다.");

  await supabase
    .from("return_requests")
    .update({
      status: "picked_up",
      admin_memo: adminMemo?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnRequestId);

  revalidateAll();
}

// ── 반품 요청 거절 (관리자 철회) ──────────────────────────────────────
export async function rejectReturnRequest(
  returnRequestId: number,
  adminMemo: string,
  customerNotice: string,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("return_requests")
    .select("status")
    .eq("id", returnRequestId)
    .single();

  if (!req) throw new Error("반품 요청을 찾을 수 없습니다.");
  if (req.status !== "requested") throw new Error("처리할 수 없는 상태입니다.");

  await supabase
    .from("return_requests")
    .update({
      status: "rejected",
      admin_memo: adminMemo.trim() || null,
      customer_notice: customerNotice.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnRequestId);

  revalidateAll();
}

// ── 반품 철회 요청 승인 ───────────────────────────────────────────────
export async function approveReturnWithdraw(
  returnRequestId: number,
  adminMemo: string | null,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("return_requests")
    .select("status")
    .eq("id", returnRequestId)
    .single();

  if (!req) throw new Error("반품 요청을 찾을 수 없습니다.");
  if (req.status !== "withdraw_requested") throw new Error("처리할 수 없는 상태입니다.");

  await supabase
    .from("return_requests")
    .update({
      status: "withdraw_completed",
      admin_memo: adminMemo?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnRequestId);

  revalidateAll();
}

// ── 반품 철회 요청 거절 ───────────────────────────────────────────────
export async function rejectReturnWithdraw(
  returnRequestId: number,
  adminMemo: string,
  customerNotice: string,
) {
  const { supabase } = await requireAdmin();

  const { data: req } = await supabase
    .from("return_requests")
    .select("status")
    .eq("id", returnRequestId)
    .single();

  if (!req) throw new Error("반품 요청을 찾을 수 없습니다.");
  if (req.status !== "withdraw_requested") throw new Error("처리할 수 없는 상태입니다.");

  // 철회 거절 → 원래 반품요청 상태로 복귀
  await supabase
    .from("return_requests")
    .update({
      status: "requested",
      admin_memo: adminMemo.trim() || null,
      customer_notice: customerNotice.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnRequestId);

  revalidateAll();
}

// ── 메모 삭제 ────────────────────────────────────────────────────────
export async function deleteCancelMemo(cancelRequestId: number) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("cancel_requests")
    .update({
      admin_memo: null,
      customer_notice: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cancelRequestId);
  revalidateAll();
}

export async function deleteReturnMemo(returnRequestId: number) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("return_requests")
    .update({
      admin_memo: null,
      customer_notice: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", returnRequestId);
  revalidateAll();
}
