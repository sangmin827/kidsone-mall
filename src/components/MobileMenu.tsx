"use client";

import { useState } from "react";
import Link from "next/link";

type Category = {
  id: number;
  name: string;
  slug: string;
};

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col gap-1 md:hidden cursor-pointer"
        aria-label="메뉴 열기"
      >
        <span className="h-0.5 w-4 bg-gray-300" />
        <span className="h-0.5 w-4 bg-gray-300" />
        <span className="h-0.5 w-4 bg-gray-300" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer text-gray-500"
              aria-label="메뉴 닫기"
            >
              메뉴 닫기 ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="border-b pb-6">
              <p className="mb-3 text-sm font-semibold text-gray-400">사용자</p>

              <div className="flex flex-col gap-4">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/mypage/cart"
                      onClick={() => setOpen(false)}
                      className="text-gray-800"
                    >
                      장바구니
                    </Link>

                    <Link
                      href="/mypage/orders"
                      onClick={() => setOpen(false)}
                      className="text-gray-800"
                    >
                      주문조회
                    </Link>

                    <Link
                      href="/mypage"
                      onClick={() => setOpen(false)}
                      className="text-gray-800"
                    >
                      마이페이지
                    </Link>

                    <form
                      action={async () => {
                        await logoutAction();
                      }}
                    >
                      <button
                        type="submit"
                        className="cursor-pointer text-left text-gray-800"
                      >
                        로그아웃
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="text-gray-800"
                  >
                    로그인
                  </Link>
                )}
              </div>
            </div>

            <div className="pt-6">
              <p className="mb-3 text-sm font-semibold text-gray-400">
                카테고리
              </p>

              <nav className="flex flex-col gap-4">
                <Link
                  href="/products"
                  onClick={() => setOpen(false)}
                  className="text-gray-800"
                >
                  전체상품
                </Link>

                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    onClick={() => setOpen(false)}
                    className="text-gray-800"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
