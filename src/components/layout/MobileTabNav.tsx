"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Category = { id: number; name: string; slug: string };

type MobileTabNavProps = {
  categories: Category[];
  isLoggedIn?: boolean; // 현재 탭 내부에서는 미사용 (주문조회는 헤더로 이동)
};

export default function MobileTabNav({ categories }: MobileTabNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "";
  const categoryParam = searchParams.get("category") ?? "";

  // 탭 활성 상태 판단
  const isNewView    = pathname === "/products" && view === "new";
  const isTop10View  = pathname === "/products" && view === "top10";
  const isSets       = pathname === "/sets";
  // /products (전체) + /categories/[slug] 모두 '전체상품' 탭 활성
  const isAllProducts =
    (!isNewView && !isTop10View && !isSets) &&
    (pathname === "/products" || pathname.startsWith("/categories/"));

  // 전체상품 탭 활성일 때 카테고리 칩 노출
  const nonSetCategories = categories.filter((c) => c.slug !== "sets");
  const showCategoryChips = isAllProducts && nonSetCategories.length > 0;

  // 현재 활성 카테고리 slug
  //   /products?category=xxx   → categoryParam
  //   /categories/xxx          → path 에서 추출
  const pathSlug =
    pathname.startsWith("/categories/")
      ? pathname.replace("/categories/", "")
      : null;
  const activeCategorySlug = categoryParam || pathSlug || "";

  const tabCls = (active: boolean) =>
    `flex-none px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
      active
        ? "border-[#5332C9] text-[#5332C9]"
        : "border-transparent text-[#6b7280] hover:text-[#222222]"
    }`;

  const chipCls = (active: boolean) =>
    `flex-none rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
      active
        ? "border-[#5332C9] bg-[#ede9fb] text-[#5332C9]"
        : "border-[#E8E6E1] bg-white text-[#6b7280] active:bg-[#FAF9F6]"
    }`;

  return (
    <div className="bg-white border-b border-[#E8E6E1] md:hidden">

      {/* ── 주요 탭 행 ── */}
      <div className="no-scrollbar flex items-center overflow-x-auto">
        <Link href="/products?view=new"   className={tabCls(isNewView)}>신상품</Link>
        <Link href="/products?view=top10" className={tabCls(isTop10View)}>Top 10</Link>
        <Link href="/products"            className={tabCls(isAllProducts)}>전체상품</Link>
        <Link href="/sets"                 className={tabCls(isSets)}>세트상품</Link>
      </div>

      {/* ── 하위 카테고리 칩 (전체상품 탭 선택 시) ── */}
      {showCategoryChips && (
        <div
          className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 py-2.5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* 전체 칩 */}
          <Link href="/products" className={chipCls(!activeCategorySlug)}>
            전체
          </Link>

          {/* 카테고리 칩 */}
          {nonSetCategories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className={chipCls(activeCategorySlug === c.slug)}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
