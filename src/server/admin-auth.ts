import { createClient } from "@/src/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("관리자 정보를 확인할 수 없습니다.");
  }

  if (profile.role !== "admin") {
    throw new Error("관리자만 접근할 수 있습니다.");
  }

  return {
    supabase,
    adminUserId: user.id,
  };
}
