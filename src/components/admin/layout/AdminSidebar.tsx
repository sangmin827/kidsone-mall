"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* ────────────────────────────────────────
   내비게이션 구조
──────────────────────────────────────── */
type NavItem = { label: string; href: string; badgeKey?: string };

type NavGroup = {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  dotKey?: string;
};

type NavSingle = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeKey?: string;
};

type NavEntry = NavGroup | NavSingle;

function isGroup(e: NavEntry): e is NavGroup {
  return "items" in e;
}

const NAV: NavEntry[] = [
  {
    id: "orders",
    label: "주문 관리",
    dotKey: "pendingPurchaseCount",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    items: [
      { label: "주문 내역 관리", href: "/admin/orders" },
      { label: "구매 희망 요청", href: "/admin/purchase-requests", badgeKey: "pendingPurchaseCount" },
    ],
  },
  {
    id: "products",
    label: "상품 관리",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    items: [
      { label: "카탈로그 관리", href: "/admin/catalog" },
      { label: "신상품 관리", href: "/admin/products/new-arrivals" },
      { label: "Top 10 관리", href: "/admin/products/top10" },
      { label: "세트상품 관리", href: "/admin/products/sets" },
    ],
  },
  {
    id: "members",
    label: "회원 관리",
    href: "/admin/members",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: "logs",
    label: "활동 로그",
    href: "/admin/activity-logs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

/* ────────────────────────────────────────
   Props
──────────────────────────────────────── */
type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  pendingOrderCount: number;
  pendingPurchaseCount: number;
};

export default function AdminSidebar({
  collapsed,
  onToggleCollapse,
  pendingOrderCount,
  pendingPurchaseCount,
}: Props) {
  const pathname = usePathname();

  const counts: Record<string, number> = {
    pendingOrderCount,
    pendingPurchaseCount,
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of NAV) {
      if (isGroup(entry)) {
        init[entry.id] = entry.items.some((item) => pathname.startsWith(item.href));
      }
    }
    return init;
  });

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function isActive(href: string) {
    if (href === "/admin/orders") return pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");
    if (href === "/admin/members") return pathname === "/admin/members" || pathname.startsWith("/admin/members/");
    return pathname.startsWith(href);
  }

  return (
    /* 항상 레이아웃 안에 존재 — fixed/overlay 없음 */
    <aside
      className={`
        relative flex h-full shrink-0 flex-col border-r border-[#E8E6E1] bg-white
        transition-[width] duration-200 ease-in-out overflow-hidden
        ${collapsed ? "w-[58px]" : "w-60"}
      `}
    >
      {/* ── 상단: 로고 + 접기 버튼 ── */}
      <div className="flex h-14 shrink-0 items-center border-b border-[#E8E6E1] px-3 gap-2">
        {/* 로고 아이콘 (항상 표시) */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5332C9]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* 로고 텍스트 (펼쳐진 상태만) */}
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#222222] leading-none truncate">Kids One</p>
            <p className="mt-0.5 text-[10px] font-medium text-[#5332C9] leading-none">관리자</p>
          </div>
        )}

        {/* 접기/펼치기 버튼 */}
        <button
          onClick={onToggleCollapse}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#FAF9F6] hover:text-[#5332C9] transition-colors"
          title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── 내비게이션 ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {NAV.map((entry) => {
          if (isGroup(entry)) {
            const isOpen = openGroups[entry.id] ?? false;
            const hasActive = entry.items.some((item) => isActive(item.href));
            const dotCount = entry.dotKey ? (counts[entry.dotKey] ?? 0) : 0;

            /* 접힌 상태: 아이콘만 */
            if (collapsed) {
              return (
                <div key={entry.id} className="flex justify-center py-0.5">
                  <Link
                    href={entry.items[0].href}
                    className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      hasActive
                        ? "bg-[#ede9fb] text-[#5332C9]"
                        : "text-[#9ca3af] hover:bg-[#FAF9F6] hover:text-[#222222]"
                    }`}
                    title={entry.label}
                  >
                    {entry.icon}
                    {dotCount > 0 && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#FF5555]" />
                    )}
                  </Link>
                </div>
              );
            }

            /* 펼쳐진 상태: 그룹 헤더 + 하위 항목 */
            return (
              <div key={entry.id}>
                <button
                  onClick={() => toggleGroup(entry.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                    hasActive && !isOpen ? "text-[#5332C9]" : "text-[#222222] hover:bg-[#FAF9F6]"
                  }`}
                >
                  <span className={`relative shrink-0 ${hasActive ? "text-[#5332C9]" : "text-[#9ca3af]"}`}>
                    {entry.icon}
                    {dotCount > 0 && !isOpen && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF5555]" />
                    )}
                  </span>
                  <span className="flex-1 text-left">{entry.label}</span>
                  {dotCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-[#FF5555]" />
                  )}
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-[#9ca3af] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-[#E8E6E1] pl-3">
                    {entry.items.map((item) => {
                      const badgeCount = item.badgeKey ? (counts[item.badgeKey] ?? 0) : 0;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                            active
                              ? "bg-[#ede9fb] font-semibold text-[#5332C9]"
                              : "text-[#6b7280] hover:bg-[#FAF9F6] hover:text-[#222222]"
                          }`}
                        >
                          {item.label}
                          {badgeCount > 0 && (
                            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF5555] px-1.5 text-[10px] font-bold text-white">
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          /* 단독 링크 */
          const active = isActive(entry.href);

          if (collapsed) {
            return (
              <div key={entry.id} className="flex justify-center py-0.5">
                <Link
                  href={entry.href}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                    active
                      ? "bg-[#ede9fb] text-[#5332C9]"
                      : "text-[#9ca3af] hover:bg-[#FAF9F6] hover:text-[#222222]"
                  }`}
                  title={entry.label}
                >
                  {entry.icon}
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={entry.id}
              href={entry.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[#ede9fb] text-[#5332C9]"
                  : "text-[#222222] hover:bg-[#FAF9F6]"
              }`}
            >
              <span className={`shrink-0 ${active ? "text-[#5332C9]" : "text-[#9ca3af]"}`}>
                {entry.icon}
              </span>
              <span className="flex-1">{entry.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── 하단: 쇼핑몰 이동 ── */}
      <div className="shrink-0 border-t border-[#E8E6E1] p-2">
        {collapsed ? (
          <a
            href="/"
            target="_blank"
            title="쇼핑몰로 이동"
            className="flex h-9 w-full items-center justify-center rounded-xl text-[#9ca3af] hover:bg-[#FAF9F6] hover:text-[#222222] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </a>
        ) : (
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#222222]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            쇼핑몰로 이동
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        )}
      </div>
    </aside>
  );
}
