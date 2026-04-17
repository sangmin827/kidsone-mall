"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useCallback } from "react";
import SocialLoginButtons from "@/src/app/login/social-login-buttons";

/**
 * URL searchParam `login=1` 이 있을 때 전역 로그인 모달을 띄운다.
 * `next` 파라미터가 있으면 로그인 성공 후 해당 경로로 이동한다.
 *
 * 트리거:
 *   - 헤더 "로그인" 버튼 (<LoginTrigger />)
 *   - 보호된 페이지에서 비로그인 유저를 여기로 redirect
 *
 * 닫기:
 *   - X 버튼 / 배경 클릭 / ESC
 */
export default function LoginModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isOpen = searchParams.get("login") === "1";
  const next = searchParams.get("next") ?? undefined;

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("login");
    params.delete("next");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleClose]);

  // 모달 열렸을 때 바디 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="로그인 창 닫기"
        >
          ✕
        </button>

        <div className="mb-6 pr-10">
          <h2 id="login-modal-title" className="text-2xl font-bold">
            로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            구글 또는 카카오 계정으로 로그인하세요.
          </p>
        </div>

        <SocialLoginButtons redirectPath={next} />

        <p className="mt-6 text-center text-xs text-gray-400">
          로그인 시{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gray-600"
          >
            이용약관
          </a>
          {" / "}
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gray-600"
          >
            개인정보처리방침
          </a>
          에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}
