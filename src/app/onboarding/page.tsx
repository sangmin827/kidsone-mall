import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getOrCreateProfile, needsOnboarding } from "@/src/server/profile";
import { submitOnboarding } from "./actions";

type Props = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export const metadata = {
  title: "회원 정보 입력 | Kids One Mall",
};

export default async function OnboardingPage({ searchParams }: Props) {
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    redirect("/login");
  }

  const profile = await getOrCreateProfile(user);

  // 이미 온보딩 끝낸 회원이면 next 로 바로 보냄
  if (!needsOnboarding(profile)) {
    redirect(next && next.startsWith("/") ? next : "/");
  }

  const safeNext = next && next.startsWith("/") ? next : "/";

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-xl items-center px-6 py-12">
      <div className="w-full space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            환영합니다 👋
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            서비스 이용을 위해 한 번만 추가 정보를 확인할게요. 다음 로그인부터는
            이 화면이 나타나지 않습니다.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form action={submitOnboarding} className="space-y-5">
          <input type="hidden" name="next" value={safeNext} />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              생년월일
            </label>
            <input
              type="date"
              name="birthdate"
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              만 14세 미만은 가입이 제한됩니다.
            </p>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700">약관 동의</p>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="agree_terms"
                required
                className="mt-1"
              />
              <span>
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-medium text-blue-600 hover:underline"
                >
                  이용약관
                </Link>
                에 동의합니다. (필수)
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="agree_privacy"
                required
                className="mt-1"
              />
              <span>
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-medium text-blue-600 hover:underline"
                >
                  개인정보처리방침
                </Link>
                에 동의합니다. (필수)
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black"
          >
            완료하고 시작하기
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          입력한 정보는 「개인정보 보호법」 및 본 사이트의 개인정보처리방침에
          따라 안전하게 관리됩니다.
        </p>
      </div>
    </main>
  );
}
