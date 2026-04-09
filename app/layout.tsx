import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kids One Mall",
  description: "아이들의 전문적인 놀이도구를 위한 쇼핑몰",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-2xl font-bold font-gmarket">
              KidsOne
            </Link>

            <nav className="hidden gap-20 md:flex">
              <Link href="#" className="nav-text">
                홈
              </Link>
              <Link href="#" className="nav-text">
                상품
              </Link>
              <Link href="#" className="nav-text">
                카테고리
              </Link>
            </nav>

            <div className="flex items-center gap-4 text-xs">
              <Link href="#" className="nav-actions">
                로그인
              </Link>
              <Link href="#" className="nav-actions">
                장바구니
              </Link>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
