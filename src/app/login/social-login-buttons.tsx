"use client";

import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SocialLoginButtons() {
  const supabase = createClient();
  const router = useRouter();

  const signInWithGoogle = async () => {
    router.refresh();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signInWithKakao = async () => {
    router.refresh();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={signInWithGoogle}
        className="w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium transition hover:bg-gray-50"
      >
        Google로 로그인
      </button>

      <button
        onClick={signInWithKakao}
        className="w-full cursor-pointer rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium transition hover:bg-gray-50"
      >
        Kakao로 로그인
      </button>
    </div>
  );
}
