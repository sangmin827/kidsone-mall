"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getOrCreateProfile } from "@/src/server/profile";

const MIN_AGE = 14;

function calculateKoreanAge(birthdate: Date, today: Date): number {
  // 만 나이 계산 (생일 기준)
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

function parseSafeNext(value: FormDataEntryValue | null): string {
  const raw = value ? String(value) : "/";
  if (!raw.startsWith("/")) return "/";
  // open-redirect 방지: protocol-relative 차단
  if (raw.startsWith("//")) return "/";
  return raw;
}

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login?error=" + encodeURIComponent("로그인이 필요합니다."));
  }

  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();
  const termsAgreed = formData.get("agree_terms") === "on";
  const privacyAgreed = formData.get("agree_privacy") === "on";
  const next = parseSafeNext(formData.get("next"));

  if (!birthdateRaw) {
    redirect(
      "/onboarding?next=" +
        encodeURIComponent(next) +
        "&error=" +
        encodeURIComponent("생년월일을 입력해주세요."),
    );
  }

  if (!termsAgreed || !privacyAgreed) {
    redirect(
      "/onboarding?next=" +
        encodeURIComponent(next) +
        "&error=" +
        encodeURIComponent("이용약관과 개인정보처리방침에 동의해주세요."),
    );
  }

  const birthdate = new Date(birthdateRaw);
  if (Number.isNaN(birthdate.getTime())) {
    redirect(
      "/onboarding?next=" +
        encodeURIComponent(next) +
        "&error=" +
        encodeURIComponent("올바른 생년월일을 입력해주세요."),
    );
  }

  const today = new Date();
  if (birthdate > today) {
    redirect(
      "/onboarding?next=" +
        encodeURIComponent(next) +
        "&error=" +
        encodeURIComponent("미래 날짜는 입력할 수 없습니다."),
    );
  }

  const age = calculateKoreanAge(birthdate, today);

  if (age < MIN_AGE) {
    // 14세 미만 → 가입 차단: 즉시 로그아웃 + 차단 안내 페이지로
    await supabase.auth.signOut();
    redirect("/onboarding/blocked");
  }

  // 프로필 갱신
  await getOrCreateProfile(user); // 행이 없으면 미리 만들어두기 (안전망)

  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      birthdate: birthdateRaw,
      terms_agreed_at: nowIso,
      privacy_agreed_at: nowIso,
    })
    .eq("id", user.id);

  if (updateError) {
    redirect(
      "/onboarding?next=" +
        encodeURIComponent(next) +
        "&error=" +
        encodeURIComponent("저장 중 오류가 발생했습니다: " + updateError.message),
    );
  }

  redirect(next);
}
