// src/server/mypage.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";

export type MyProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
};

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, phone")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(`프로필 조회 실패: ${error.message}`);
  }

  return data as MyProfile;
}

export async function updateMyProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({
      name: name || null,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`프로필 수정 실패: ${error.message}`);
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/profile");
}
