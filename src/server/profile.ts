import { createClient } from "@/src/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  birthdate: string | null;
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
};

const PROFILE_COLUMNS =
  "id, email, name, phone, role, birthdate, terms_agreed_at, privacy_agreed_at";

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
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (findError) {
    throw new Error(`프로필 조회 실패: ${findError.message}`);
  }

  if (existingProfile) {
    return existingProfile as Profile;
  }

  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email!,
      name: getProfileName(user),
      phone: null,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (insertError) {
    throw new Error(`프로필 생성 실패: ${insertError.message}`);
  }

  return newProfile as Profile;
}

/**
 * 온보딩(생년월일 확인 + 이용약관·개인정보 동의)이 아직 안 끝난 경우 true.
 *
 * 세 조건 모두 충족되어야 완료로 간주:
 *   - birthdate 가 설정돼 있고
 *   - terms_agreed_at 타임스탬프가 있고
 *   - privacy_agreed_at 타임스탬프가 있음
 */
export function needsOnboarding(profile: Pick<
  Profile,
  "birthdate" | "terms_agreed_at" | "privacy_agreed_at"
>): boolean {
  return (
    !profile.birthdate ||
    !profile.terms_agreed_at ||
    !profile.privacy_agreed_at
  );
}
