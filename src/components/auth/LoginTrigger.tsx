"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Props = {
  className?: string;
  children?: React.ReactNode;
  /**
   * 클릭 후 로그인 모달이 뜨기 전에 실행할 추가 동작.
   * 예) 모바일 메뉴를 먼저 닫고 모달 열기.
   */
  onBeforeOpen?: () => void;
};

/**
 * 클릭하면 현재 경로에 `?login=1` 을 붙여서 <LoginModal /> 이 뜨게 한다.
 * 현재 페이지 상태는 그대로 유지되므로,
 * 로그인 모달을 닫으면 하던 작업을 이어서 할 수 있다.
 */
export default function LoginTrigger({
  className,
  children,
  onBeforeOpen,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleClick = useCallback(() => {
    onBeforeOpen?.();
    const params = new URLSearchParams(searchParams.toString());
    params.set("login", "1");
    router.push(`${pathname}?${params.toString()}`);
  }, [onBeforeOpen, pathname, router, searchParams]);

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children ?? "로그인"}
    </button>
  );
}
