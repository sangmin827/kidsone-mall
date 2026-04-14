import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { createClient } from '@/src/lib/supabase/server';
import { logout } from '@/src/app/logout/actions';
import CategoryMenu from '@/src/components/CategoryMenu';
import MobileMenu from '@/src/components/MobileMenu';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Kids One Mall',
  description: '아이들의 전문적인 놀이도구를 위한 쇼핑몰',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();

  const [{ data: categoriesData }, { data: userData }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const categories = categoriesData ?? [];
  const user = userData.user;
  const isLoggedIn = !!user;

  let profile: { role: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    profile = data;
  }

  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">
        <header className="static top-0 z-50 border-b border-gray-200 bg-white lg:sticky">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="flex flex-1 justify-center md:flex-none md:justify-center"
            >
              <Image
                src="/kids-one-logo.png"
                alt="KidsOne 로고"
                width={80}
                height={60}
                className="h-auto w-14 md:w-12"
                priority
              />
            </Link>

            <CategoryMenu />

            <div className="hidden items-center gap-4 text-xs md:flex">
              {user ? (
                <>
                  <form action={logout}>
                    <button type="submit" className="nav-actions">
                      로그아웃
                    </button>
                  </form>

                  <Link href="/mypage/cart" className="nav-actions">
                    장바구니
                  </Link>

                  <Link href="/mypage" className="nav-actions">
                    마이페이지
                  </Link>

                  {profile?.role === 'admin' && (
                    <Link href="/admin" className="nav-actions">
                      관리자 주문관리
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/login" className="nav-actions">
                  로그인
                </Link>
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

        <Script
          src="//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          strategy="afterInteractive"
        />

        <Toaster position="top-center" richColors expand closeButton />
      </body>
    </html>
  );
}
