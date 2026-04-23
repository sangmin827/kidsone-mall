import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { createClient } from "@/src/lib/supabase/server";
import CategoryMenu from "@/src/components/CategoryMenu";
import Footer from "@/src/components/layout/Footer";
import HeaderSearch from "@/src/components/layout/HeaderSearch";
import ScrollRevealBar from "@/src/components/layout/ScrollRevealBar";
import MobileTabNav from "@/src/components/layout/MobileTabNav";
import { Toaster } from "sonner";
import { Suspense } from "react";
import AuthToastBridge from "@/src/components/auth/AuthToastBridge";
import LogoutButton from "@/src/components/auth/LogoutButton";
import LoginModal from "@/src/components/auth/LoginModal";
import LoginTrigger from "@/src/components/auth/LoginTrigger";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Kids One Mall",
  description: "아이들의 전문적인 놀이도구를 위한 쇼핑몰",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();

  const [{ data: categoriesData }, { data: userData }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const categories = categoriesData ?? [];
  const user = userData.user;
  const isLoggedIn = !!user;

  let profile: { role: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  // 헤더 장바구니 배지용 카운트
  let cartItemCount = 0;
  if (user) {
    const { data: cartRow } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (cartRow) {
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("cart_id", cartRow.id);
      cartItemCount = count ?? 0;
    }
  }

  return (
    <html lang="ko">
      <body className="bg-[#FAF9F6] text-[#222222] antialiased">
        {/* ══════════════════════════════════════════════════════
            HEADER — sticky top-0, 항상 고정 (절대 숨겨지지 않음)
        ══════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-50 border-b border-[#E8E6E1] bg-white/95 backdrop-blur-sm">
          {/* ━━━ 모바일 / 태블릿 (md 미만) ━━━ */}
          <div className="flex h-14 items-center px-3 md:hidden">
            {/* 왼쪽: 검색 */}
            <HeaderSearch />

            {/* 가운데: 로고 */}
            <Link
              href="/"
              className="flex flex-1 justify-center"
              aria-label="Kids One 홈"
            >
              <Image
                src="/kids-one-logo.png"
                alt="KidsOne 로고"
                width={80}
                height={60}
                className="h-auto w-11"
                priority
              />
            </Link>

            {/* 오른쪽: 아이콘 그룹 */}
            <div className="flex items-center gap-0.5">
              {user ? (
                /* ── 로그인 상태 ── */
                <>
                  {/* 찜하기 */}
                  <Link
                    href="/mypage/wishlist"
                    title="찜한 상품"
                    aria-label="찜한 상품"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#FF5555]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </Link>

                  {/* 장바구니 (배지 오른쪽 하단) */}
                  <Link
                    href="/mypage/cart"
                    title="장바구니"
                    aria-label="장바구니"
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5555] text-[9px] font-bold text-white shadow-sm">
                        {cartItemCount > 9 ? "9+" : cartItemCount}
                      </span>
                    )}
                  </Link>

                  {/* 마이페이지 */}
                  <Link
                    href="/mypage"
                    title="마이페이지"
                    aria-label="마이페이지"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5332C9] text-white transition-colors hover:bg-[#4427b0]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                      aria-hidden="true"
                    >
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </Link>
                </>
              ) : (
                /* ── 비로그인 상태 ── */
                <Suspense
                  fallback={
                    <div className="flex items-center gap-0.5">
                      <div className="h-9 w-9 rounded-xl bg-[#FAF9F6]" />
                      <div className="h-9 w-9 rounded-xl bg-[#FAF9F6]" />
                      <div className="h-4 w-10 rounded bg-[#FAF9F6]" />
                    </div>
                  }
                >
                  <LoginTrigger className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </LoginTrigger>

                  <Link
                    href="/guest-order"
                    className="flex-none px-1.5 text-[11px] font-medium text-[#9ca3af] whitespace-nowrap transition-colors hover:text-[#6b7280]"
                  >
                    주문조회
                  </Link>
                </Suspense>
              )}
            </div>
          </div>

          {/* ━━━ 데스크톱 (md 이상) ━━━ */}
          <div className="mx-auto hidden h-14 max-w-7xl items-center justify-between gap-4 px-6 md:flex">
            {/* 로고 */}
            <Link href="/" className="flex-shrink-0" aria-label="Kids One 홈">
              <Image
                src="/kids-one-logo.png"
                alt="KidsOne 로고"
                width={80}
                height={60}
                className="h-auto w-10"
                priority
              />
            </Link>

            {/* 카테고리 네비게이션 */}
            <CategoryMenu />

            {/* 오른쪽 액션 */}
            <div className="flex items-center gap-1">
              <HeaderSearch />

              {user ? (
                <>
                  {/* 찜하기 */}
                  <Link
                    href="/mypage/wishlist"
                    title="찜한 상품"
                    aria-label="찜한 상품"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#FF5555]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </Link>

                  {/* 장바구니 (배지 오른쪽 하단) */}
                  <Link
                    href="/mypage/cart"
                    title="장바구니"
                    aria-label="장바구니"
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5555] text-[9px] font-bold text-white shadow-sm">
                        {cartItemCount > 9 ? "9+" : cartItemCount}
                      </span>
                    )}
                  </Link>

                  {/* 마이페이지 */}
                  <Link
                    href="/mypage"
                    title="마이페이지"
                    aria-label="마이페이지"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Link>

                  <div className="mx-1 h-4 w-px bg-[#E8E6E1]" />
                  <LogoutButton className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#9ca3af] transition-colors hover:bg-[#FAF9F6] hover:text-[#6b7280] disabled:cursor-not-allowed disabled:opacity-50" />

                  {profile?.role === "admin" && (
                    <Link
                      href="/admin"
                      className="ml-1 rounded-lg bg-[#ede9fb] px-2.5 py-1.5 text-xs font-semibold text-[#5332C9] transition-colors hover:bg-[#5332C9] hover:text-white"
                    >
                      관리자
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="mx-1 h-4 w-px bg-[#E8E6E1]" />
                  <Suspense
                    fallback={
                      <span className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#6b7280] opacity-60">
                        로그인
                      </span>
                    }
                  >
                    <LoginTrigger className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]">
                      로그인
                    </LoginTrigger>
                  </Suspense>
                  <Link
                    href="/guest-order"
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#6b7280] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]"
                  >
                    주문조회
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* 탭 네비게이션 */}
        <ScrollRevealBar>
          <Suspense
            fallback={
              <div className="h-10 border-b border-[#E8E6E1] bg-white" />
            }
          >
            <MobileTabNav categories={categories} isLoggedIn={isLoggedIn} />
          </Suspense>
        </ScrollRevealBar>

        {/* Page Content */}
        <div className="min-h-screen">{children}</div>

        <Footer />

        <Script
          src="//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          strategy="afterInteractive"
        />
        <AuthToastBridge />
        <Toaster
          position="top-center"
          richColors
          expand
          closeButton
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontFamily: "Pretendard, sans-serif",
            },
          }}
        />
        <Suspense fallback={null}>
          <LoginModal />
        </Suspense>
        <SpeedInsights />
      </body>
    </html>
  );
}
