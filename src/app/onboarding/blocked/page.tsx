import Link from "next/link";

export const metadata = {
  title: "가입이 제한되었습니다 | Kids One Mall",
};

export default function OnboardingBlockedPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-12">
      <div className="w-full space-y-5 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-amber-900">
          가입이 제한되었습니다
        </h1>
        <p className="text-sm leading-6 text-amber-800">
          만 14세 미만의 아동은 「개인정보 보호법」에 따라 본 서비스의
          회원가입이 제한됩니다. 이용에 불편을 드려 죄송합니다.
        </p>
        <p className="text-xs text-amber-700">
          만 14세 이상이신 경우, 잠시 후 다시 로그인하여 정확한 생년월일을
          입력해주세요.
        </p>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-block rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-black"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
