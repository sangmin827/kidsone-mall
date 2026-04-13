import { createClient } from "@/src/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "customer" | "admin";
};

function getProfileName(user: User) {
  const metadata = user.user_metadata;

  return (
    metadata?.full_name ??
    metadata?.name ??
    metadata?.nickname ??
    user.email?.split("@")[0] ??
    null
  );
}

export async function getOrCreateProfile(user: User): Promise<Profile> {
  const supabase = await createClient();

  const { data: existingProfile, error: findError } = await supabase
    .from("profiles")
    .select("id, email, name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  if (findError) {
    throw new Error(`프로필 조회 실패: ${findError.message}`);
  }

  if (existingProfile) {
    return existingProfile;
  }

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email!,
      name: getProfileName(user),
      phone: null,
    })
    .select("id, email, name, phone, role")
    .single();

  if (insertError) {
    throw new Error(`프로필 생성 실패: ${insertError.message}`);
  }

  return newProfile;
}
