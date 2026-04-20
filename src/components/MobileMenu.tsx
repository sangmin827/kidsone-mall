"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginTrigger from "@/src/components/auth/LoginTrigger";

type Category = { id: number; name: string; slug: string };

type MobileMenuProps = {
  categories: Category[];
  isLoggedIn: boolean;
  logoutAction: () => Promise<unknown>;
};

export default function MobileMenu({
  categories,
  isLoggedIn,
  logoutAction,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  // body 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // 드로어 열릴 때 닫기 버튼에 포커스
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // 공통 링크 스타일 — 터치 타깃 최소 48px
  const itemCls =
    "flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#222222] transition-colors hover:bg-[#F5F4F1] hover:text-[#5332C9] active:bg-[#ede9fb]";

  return (
    <>
      {/* ── 햄버거 버튼 (모바일/태블릿만) ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-colors hover:bg-[#F5F4F1] md:hidden"
        aria-label="메뉴 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {/* 3선 아이콘 */}
        <span className="flex flex-col gap-[5px]" aria-hidden="true">
          <span className="h-[2px] w-5 rounded-full bg-[#222222]" />
          <span className="h-[2px] w-5 rounded-full bg-[#222222]" />
          <span className="h-[2px] w-3.5 rounded-full bg-[#222222]" />
        </span>
      </button>

      {/* ── 오버레이 — 항상 DOM 유지, opacity로 페이드 ── */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── 드로어 — 항상 DOM 유지, translate로 슬라이드 ── */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(300px,85vw)] flex-col bg-white shadow-[−8px_0_40px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="사이트 메뉴"
      >

        {/* ── 드로어 헤더 ── */}
        <div className="flex flex-none items-center justify-between border-b border-[#E8E6E1] px-4 py-3">
          <Link href="/" onClick={close} aria-label="Kids One 홈" className="inline-flex items-center">
            <Image
              src="/kids-one-logo.png"
              alt="KidsOne"
              width={70}
              height={52}
              className="h-auto w-10"
            />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#F5F4F1] hover:text-[#222222]"
            aria-label="메뉴 닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── 스크롤 가능한 본문 ── */}
        <div className="flex-1 overflow-y-auto px-3 py-4">

          {/* 계정 섹션 */}
          <section className="mb-5">
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              계정
            </p>
            <div className="space-y-0.5">
              {isLoggedIn ? (
                <>
                  <Link href="/mypage" onClick={close} className={itemCls}>
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#ede9fb]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5332C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    마이페이지
                  </Link>

                  <Link href="/mypage/cart" onClick={close} className={itemCls}>
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#fff0f0]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF5555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                      </svg>
                    </span>
                    장바구니
                  </Link>

                  <Link href="/mypage/orders" onClick={close} className={itemCls}>
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#fef9ec]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                      </svg>
                    </span>
                    주문내역
                  </Link>

                  <form
                    action={async () => {
                      await logoutAction();
                    }}
                  >
                    <button
                      type="submit"
                      className={`${itemCls} w-full text-left`}
                    >
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#F5F4F1]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                      </span>
                      로그아웃
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <LoginTrigger
                    className={`${itemCls} w-full`}
                    onBeforeOpen={close}
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#ede9fb]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5332C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                    </span>
                    로그인
                  </LoginTrigger>

                  <Link href="/guest-order" onClick={close} className={itemCls}>
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#F5F4F1]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </span>
                    비회원 주문조회
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* 구분선 */}
          <div className="mx-3 mb-5 h-px bg-[#E8E6E1]" />

          {/* 쇼핑 섹션 */}
          <section>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              쇼핑
            </p>
            <nav className="space-y-0.5">
              <Link href="/products?view=new" onClick={close} className={itemCls}>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#fff0f6] text-base" aria-hidden="true">
                  ✨
                </span>
                신상품
              </Link>

              <Link href="/products?view=top10" onClick={close} className={itemCls}>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#fff8e6] text-base" aria-hidden="true">
                  🏆
                </span>
                Top 10
              </Link>

              <Link href="/products" onClick={close} className={itemCls}>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#F5F4F1]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="3" width="7" height="7" rx="1"/>
                    <rect x="15" y="3" width="7" height="7" rx="1"/>
                    <rect x="2" y="14" width="7" height="7" rx="1"/>
                    <rect x="15" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </span>
                전체 상품
              </Link>

              {/* 카테고리 목록 */}
              {categories.length > 0 && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-[#ede9fb] pl-3">
                  {categories
                    .filter((c) => c.slug !== "sets")
                    .map((c) => (
                      <Link
                        key={c.id}
                        href={`/categories/${c.slug}`}
                        onClick={close}
                        className="flex min-h-[40px] items-center rounded-lg px-3 text-sm text-[#6b7280] transition-colors hover:bg-[#F5F4F1] hover:text-[#5332C9]"
                      >
                        {c.name}
                      </Link>
                    ))}
                  {categories
                    .filter((c) => c.slug === "sets")
                    .map((c) => (
                      <Link
                        key={c.id}
                        href={`/categories/${c.slug}`}
                        onClick={close}
                        className="flex min-h-[40px] items-center rounded-lg px-3 text-sm text-[#6b7280] transition-colors hover:bg-[#F5F4F1] hover:text-[#5332C9]"
                      >
                        {c.name}
                      </Link>
                    ))}
                </div>
              )}
            </nav>
          </section>
        </div>

        {/* ── 드로어 푸터 ── */}
        <div className="flex-none border-t border-[#E8E6E1] px-5 py-4">
          <p className="text-[11px] text-[#9ca3af]">© Kids One Mall</p>
        </div>
      </aside>
    </>
  );
}
