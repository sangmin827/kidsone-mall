"use client";

import { useState, useLayoutEffect } from "react";
import AdminSidebar from "@/src/components/admin/layout/AdminSidebar";

type Props = {
  children: React.ReactNode;
  pendingOrderCount: number;
  pendingPurchaseCount: number;
};

export default function AdminShell({
  children,
  pendingOrderCount,
  pendingPurchaseCount,
}: Props) {
  // 모바일(768px 미만)에서는 기본으로 접힌 상태로 시작
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#FAF9F6]">

      {/* 사이드바 — 모든 화면에서 항상 표시 */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        pendingOrderCount={pendingOrderCount}
        pendingPurchaseCount={pendingPurchaseCount}
      />

      {/* 우측: 상단바 + 콘텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* 상단 바 */}
        <header className="flex h-14 shrink-0 items-center border-b border-[#E8E6E1] bg-white px-4 gap-3">
          {/* 접기/펼치기 토글 (모든 화면) */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#FAF9F6] hover:text-[#5332C9] transition-colors"
            aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-[#9ca3af] sm:block">Kids One Mall</span>
            <span className="inline-flex items-center rounded-full bg-[#ede9fb] px-2.5 py-1 text-[11px] font-semibold text-[#5332C9]">
              Admin
            </span>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
