"use client";

import { useState, useEffect, useRef } from "react";

/**
 * 탭 네비게이션용 스크롤 reveal 바
 *
 * - sticky top-14 : 고정 헤더(h-14 = 56px) 바로 아래에 붙음
 * - 아래 스크롤 → -translate-y-full : 헤더 뒤로 슬라이드 (z-index 차이로 가려짐)
 * - 위로 조금이라도 스크롤 → translate-y-0 : 즉시 복귀
 * - md:hidden : 데스크톱에서는 렌더링 자체를 생략
 */
export default function ScrollRevealBar({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastScrollY.current;

        if (diff > 6 && y > 60) {
          // 아래로 6px 이상 + 60px 지점 이후 → 숨김
          setHidden(true);
        } else if (diff < -4) {
          // 위로 4px 이상 → 즉시 노출
          setHidden(false);
        }

        lastScrollY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-14 z-40 md:hidden transition-transform duration-300 ease-in-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {children}
    </div>
  );
}
