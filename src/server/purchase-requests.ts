"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { requireAdmin } from "@/src/server/admin-auth";
import { writeAdminActivityLog } from "@/src/server/admin-activity-logs";

export type PurchaseRequest = {
  id: number;
  product_id: number;
  product_name: string | null;
  customer_name: string;
  customer_phone: string;
  privacy_agreed: boolean;
  status: "pending" | "contacted" | "closed";
  admin_memo: string | null;
  created_at: string;
};

const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/;

/**
 * 고객(비회원도 가능)이 품절 상품에 대해 재입고 시 안내를 받기 위해
 * 연락처를 남기는 server action.
 */
export async function submitPurchaseRequest(formData: FormData): Promise<{
  ok: boolean;
  message: string;
}> {
  const productId = Number(formData.get("product_id"));
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();
  const privacyAgreed = formData.get("privacy_agreed") === "on";

  if (!productId || Number.isNaN(productId)) {
    return { ok: false, message: "상품 정보가 올바르지 않습니다." };
  }
  if (!customerName) {
    return { ok: false, message: "이름을 입력해주세요." };
  }
  if (!customerPhone) {
    return { ok: false, message: "연락처를 입력해주세요." };
  }
  if (!PHONE_REGEX.test(customerPhone)) {
    return {
      ok: false,
      message: "올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)",
    };
  }
  if (!privacyAgreed) {
    return {
      ok: false,
      message: "개인정보 수집·이용에 동의해주셔야 신청이 가능합니다.",
    };
  }

  const supabase = await createClient();

  // 중복 신청 방지 — 동일 연락처 + 동일 상품은 1회만 허용
  const { data: existing } = await supabase
    .from("purchase_requests")
    .select("id")
    .eq("product_id", productId)
    .eq("customer_phone", customerPhone)
    .maybeSingle();

  if (existing) {
    return { ok: false, message: "이미 신청했습니다." };
  }

  // 상품명 스냅샷 — 나중에 상품이 삭제돼도 관리자가 어떤 상품이었는지 알 수 있도록
  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", productId)
    .maybeSingle();

  const { error } = await supabase.from("purchase_requests").insert({
    product_id: productId,
    product_name: product?.name ?? null,
    customer_name: customerName,
    customer_phone: customerPhone,
    privacy_agreed: true,
    status: "pending",
  });

  if (error) {
    return {
      ok: false,
      message: `신청 저장 실패: ${error.message}`,
    };
  }

  revalidatePath("/admin/purchase-requests");

  return {
    ok: true,
    message:
      "구매 희망 신청이 접수되었습니다. 재입고 시 빠르게 안내해드리겠습니다.",
  };
}

type GetPurchaseRequestsParams = {
  status?: "pending" | "contacted" | "closed";
  limit?: number;
  offset?: number;
};

export async function getPurchaseRequests(
  params: GetPurchaseRequestsParams = {},
): Promise<{ requests: PurchaseRequest[]; total: number }> {
  await requireAdmin();
  const supabase = await createClient();

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = supabase
    .from("purchase_requests")
    .select(
      "id, product_id, product_name, customer_name, customer_phone, privacy_agreed, status, admin_memo, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`구매 희망 요청 조회 실패: ${error.message}`);
  }

  return {
    requests: (data ?? []) as PurchaseRequest[],
    total: count ?? 0,
  };
}

export async function updatePurchaseRequest(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "pending") as
    | "pending"
    | "contacted"
    | "closed";
  const adminMemo = String(formData.get("admin_memo") ?? "").trim() || null;

  if (!id || Number.isNaN(id)) {
    throw new Error("요청 ID가 올바르지 않습니다.");
  }

  if (!["pending", "contacted", "closed"].includes(status)) {
    throw new Error("올바르지 않은 상태입니다.");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("purchase_requests")
    .update({ status, admin_memo: adminMemo })
    .eq("id", id);

  if (error) {
    throw new Error(`상태 변경 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: "status_change",
    entityType: "purchase_request",
    entityId: String(id),
    afterData: { status, admin_memo: adminMemo },
    description: `구매 희망 요청 상태 변경 → ${status}`,
  });

  revalidatePath("/admin/purchase-requests");
}
