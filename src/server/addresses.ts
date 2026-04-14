// src/server/addresses.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";

export type ShippingAddress = {
  id: number;
  user_id: string;
  recipient_name: string;
  recipient_phone: string;
  postal_code: string | null;
  address_main: string;
  address_detail: string | null;
  memo: string | null;
  is_default: boolean;
  created_at: string;
};

export async function getMyAddresses(): Promise<ShippingAddress[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .select(
      `
      id,
      user_id,
      recipient_name,
      recipient_phone,
      postal_code,
      address_main,
      address_detail,
      memo,
      is_default,
      created_at
    `,
    )
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`배송지 조회 실패: ${error.message}`);
  }

  return (data ?? []) as ShippingAddress[];
}

export async function createMyAddress(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { count, error: countError } = await supabase
    .from("shipping_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    throw new Error(`배송지 개수 확인 실패: ${countError.message}`);
  }

  if ((count ?? 0) >= 3) {
    throw new Error("배송지는 최대 3개까지 저장할 수 있습니다.");
  }

  const recipient_name = String(formData.get("recipient_name") ?? "").trim();
  const recipient_phone = String(formData.get("recipient_phone") ?? "").trim();
  const postal_code = String(formData.get("postal_code") ?? "").trim();
  const address_main = String(formData.get("address_main") ?? "").trim();
  const address_detail = String(formData.get("address_detail") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();

  if (
    !recipient_name ||
    !recipient_phone ||
    !postal_code ||
    !address_main ||
    !address_detail
  ) {
    throw new Error(
      "수령자 이름, 연락처, 우편번호, 기본주소, 상세주소는 필수입니다.",
    );
  }

  const { error } = await supabase.from("shipping_addresses").insert({
    user_id: user.id,
    recipient_name,
    recipient_phone,
    postal_code: postal_code || null,
    address_main,
    address_detail: address_detail || null,
    memo: memo || null,
    is_default: (count ?? 0) === 0,
  });

  if (error) {
    throw new Error(`배송지 추가 실패: ${error.message}`);
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/addresses");
}

export async function deleteMyAddress(addressId: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`배송지 삭제 실패: ${error.message}`);
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/addresses");
}
