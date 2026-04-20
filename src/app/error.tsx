"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅 — 필요 시 Sentry 등 연동
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FAF9F6] px-6 py-20 text-center">
      {/* Illustration */}
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#fff0f0]" />
        <span className="relative text-6xl" role="img" aria-label="잠시 쉬는 중">🤸</span>
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5555] text-xs font-bold text-white shadow">!</span>
      </div>

      <div className="max-w-md space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#FF5555]">500 — 서버 오류</p>
        <h1 className="font-gmarket text-3xl font-bold text-[#222222] sm:text-4xl">
          잠깐 휴식 중이에요
        </h1>
        <p className="text-sm leading-7 text-[#6b7280]">
          서버에서 문제가 발생했어요. 잠시 후 다시 시도해 주세요.<br />
          문제가 계속되면 고객센터로 문의해 주세요.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-primary gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></svg>
          다시 시도하기
        </button>
        <a href="/" className="btn-ghost">
          홈으로 가기
        </a>
      </div>

      {error.digest && (
        <p className="mt-10 text-[11px] text-[#9ca3af]">
          오류 코드: {error.digest}
        </p>
      )}
    </main>
  );
}
