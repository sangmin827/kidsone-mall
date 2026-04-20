"use client";

import { useState, useEffect, useRef } from "react";

/**
 * 스크롤 reveal 헤더 래퍼
 * - 아래로 스크롤 → 헤더 + 탭 영역 숨김 (위로 슬라이드)
 * - 위로 스크롤   → 다시 보임 (아래로 슬라이드)
 * - md 이상(데스크톱)에서는 항상 보임 (md:translate-y-0 로 override)
 */
export default function StickyNavWrapper({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const diff = currentY - lastScrollY.current;

        // 아래로 6px 이상 + 80px 이후부터 숨김
        if (diff > 6 && currentY > 80) {
          setHidden(true);
        } else if (diff < -6) {
          // 위로 조금이라도 스크롤하면 즉시 노출
          setHidden(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-50 transition-transform duration-300 ease-in-out md:translate-y-0 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {children}
    </div>
  );
}
