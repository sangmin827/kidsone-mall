"use client";

import { createClient } from "@/src/lib/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  redirectPath?: string;
};

export default function SocialLoginButtons({ redirectPath }: Props) {
  const supabase = createClient();
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "kakao" | null
  >(null);

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    try {
      setLoadingProvider(provider);
      toast.message(
        provider === "google"
          ? "구글 로그인 페이지로 이동 중입니다."
          : "카카오 로그인 페이지로 이동 중입니다.",
      );

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback${
            redirectPath ? `?next=${encodeURIComponent(redirectPath)}` : ""
          }`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoadingProvider(null);
      }
    } catch (error) {
      toast.error("소셜 로그인 중 오류가 발생했습니다.");
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleSocialLogin("google")}
        disabled={loadingProvider !== null}
        className="w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingProvider === "google"
          ? "Google 로그인 이동 중..."
          : "Google로 로그인"}
      </button>

      <button
        type="button"
        onClick={() => handleSocialLogin("kakao")}
        disabled={loadingProvider !== null}
        className="w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingProvider === "kakao"
          ? "Kakao 로그인 이동 중..."
          : "Kakao로 로그인"}
      </button>
    </div>
  );
}
