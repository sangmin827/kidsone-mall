"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCancelRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orderId = Number(formData.get("orderId"));
  const type =
    (formData.get("type") as string) === "partial" ? "partial" : "full";
  const reason = (formData.get("reason") as string)?.trim() || null;
  const refundBank =
    (formData.get("refundBank") as string)?.trim() || null;
  const refundAccountNumber =
    (formData.get("refundAccountNumber") as string)?.trim() || null;
  const refundAccountName =
    (formData.get("refundAccountName") as string)?.trim() || null;
  const itemsRaw = (formData.get("items") as string) || "[]";

  if (!orderId) throw new Error("주문 정보가 없습니다.");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw new Error("주문을 찾을 수 없습니다.");
  if (user && order.user_id !== user.id) throw new Error("권한이 없습니다.");

  if (!["pending", "paid", "preparing"].includes(order.status)) {
    if (["shipping", "delivered"].includes(order.status)) {
      throw new Error("배송이 시작된 후에는 취소가 불가합니다. 반품 신청을 이용해 주세요.");
    }
    throw new Error("현재 상태에서는 취소 요청이 불가합니다.");
  }

  const { data: existing } = await supabase
    .from("cancel_requests")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) throw new Error("이미 취소 요청이 접수된 주문입니다.");

  const { data: cancelReq, error: insertError } = await supabase
    .from("cancel_requests")
    .insert({
      order_id: orderId,
      user_id: user?.id ?? null,
      type,
      status: "requested",
      reason,
      refund_bank: refundBank,
      refund_account_number: refundAccountNumber,
      refund_account_name: refundAccountName,
    })
    .select("id")
    .single();

  if (insertError || !cancelReq) {
    throw new Error("취소 요청 생성에 실패했습니다.");
  }

  if (type === "partial") {
    try {
      const items = JSON.parse(itemsRaw) as Array<{
        order_item_id: number;
        quantity: number;
      }>;
      if (items.length > 0) {
        await supabase.from("cancel_request_items").insert(
          items.map((item) => ({
            cancel_request_id: cancelReq.id,
            order_item_id: item.order_item_id,
            quantity: item.quantity,
          })),
        );
      }
    } catch {
      /* ignore JSON parse errors */
    }
  }

  // pending / paid → 즉시 취소 완료 (전체 취소에 한함)
  // 부분취소 및 상품준비중은 관리자 검토 후 처리됩니다
  if (
    (order.status === "pending" || order.status === "paid") &&
    type === "full"
  ) {
    await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    // 취소 요청도 완료 처리
    await supabase
      .from("cancel_requests")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", cancelReq.id);
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/orders");
}

// ── 취소 요청 철회 ────────────────────────────────────────────────────
export async function requestCancelWithdrawal(cancelRequestId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: cancelReq, error } = await supabase
    .from("cancel_requests")
    .select("id, status, order_id")
    .eq("id", cancelRequestId)
    .single();

  if (error || !cancelReq) throw new Error("취소 요청을 찾을 수 없습니다.");
  if (cancelReq.status !== "requested") {
    throw new Error("현재 상태에서는 철회 요청이 불가합니다.");
  }

  const { data: order } = await supabase
    .from("orders")
    .select("user_id")
    .eq("id", cancelReq.order_id)
    .single();

  if (!order || order.user_id !== user.id) throw new Error("권한이 없습니다.");

  const { error: updateError } = await supabase
    .from("cancel_requests")
    .update({ status: "withdraw_requested", updated_at: new Date().toISOString() })
    .eq("id", cancelRequestId);

  if (updateError) throw new Error("철회 요청에 실패했습니다.");

  revalidatePath("/mypage");
  revalidatePath("/mypage/orders");
}

// ── 반품 요청 철회 ────────────────────────────────────────────────────
export async function requestReturnWithdrawal(returnRequestId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: returnReq, error } = await supabase
    .from("return_requests")
    .select("id, status, order_id")
    .eq("id", returnRequestId)
    .single();

  if (error || !returnReq) throw new Error("반품 요청을 찾을 수 없습니다.");
  if (returnReq.status !== "requested") {
    throw new Error("현재 상태에서는 철회 요청이 불가합니다.");
  }

  const { data: order } = await supabase
    .from("orders")
    .select("user_id")
    .eq("id", returnReq.order_id)
    .single();

  if (!order || order.user_id !== user.id) throw new Error("권한이 없습니다.");

  const { error: updateError } = await supabase
    .from("return_requests")
    .update({ status: "withdraw_requested", updated_at: new Date().toISOString() })
    .eq("id", returnRequestId);

  if (updateError) throw new Error("철회 요청에 실패했습니다.");

  revalidatePath("/mypage");
  revalidatePath("/mypage/orders");
}

export async function createReturnRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orderId = Number(formData.get("orderId"));
  const type =
    (formData.get("type") as string) === "partial" ? "partial" : "full";
  const reason = (formData.get("reason") as string)?.trim() || null;
  const itemsRaw = (formData.get("items") as string) || "[]";

  if (!orderId) throw new Error("주문 정보가 없습니다.");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, user_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) throw new Error("주문을 찾을 수 없습니다.");
  if (user && order.user_id !== user.id) throw new Error("권한이 없습니다.");

  if (!["shipping", "delivered"].includes(order.status)) {
    throw new Error("현재 상태에서는 반품 요청이 불가합니다.");
  }

  const { data: existing } = await supabase
    .from("return_requests")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) throw new Error("이미 반품 요청이 접수된 주문입니다.");

  const { data: returnReq, error: insertError } = await supabase
    .from("return_requests")
    .insert({
      order_id: orderId,
      user_id: user?.id ?? null,
      type,
      status: "requested",
      reason,
    })
    .select("id")
    .single();

  if (insertError || !returnReq) {
    throw new Error("반품 요청 생성에 실패했습니다.");
  }

  if (type === "partial") {
    try {
      const items = JSON.parse(itemsRaw) as Array<{
        order_item_id: number;
        quantity: number;
      }>;
      if (items.length > 0) {
        await supabase.from("return_request_items").insert(
          items.map((item) => ({
            return_request_id: returnReq.id,
            order_item_id: item.order_item_id,
            quantity: item.quantity,
          })),
        );
      }
    } catch {
      /* ignore */
    }
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/orders");
}
