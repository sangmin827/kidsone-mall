import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/logout/actions";
import CategoryMenu from "@/components/CategoryMenu";
import MobileMenu from "@/components/MobileMenu";

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

  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">
        <header className="static lg:sticky top-0 z-50 border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="flex justify-center md:justify-center flex-1 md:flex-none"
            >
              <Image
                src="/kids-one-logo.png"
                alt="KidsOne 로고"
                width={80}
                height={60}
                className="md:w-12 w-14 h-auto"
                priority
              />
            </Link>

            <CategoryMenu />

            <div className="hidden md:flex items-center gap-4 text-xs">
              {user ? (
                <>
                  <form action={logout}>
                    <button type="submit" className="nav-actions">
                      로그아웃
                    </button>
                  </form>
                  <Link href="/cart" className="nav-actions">
                    장바구니
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="nav-actions">
                    로그인
                  </Link>
                </>
              )}
            </div>
            <MobileMenu
              categories={categories}
              isLoggedIn={isLoggedIn}
              logoutAction={logout}
            />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
