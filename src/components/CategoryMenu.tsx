import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

export default async function CategoryMenu() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, level, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  const setCategory = categories?.find((c) => c.slug === "sets");
  const overviewChildren = (categories ?? []).filter(
    (c) => c.level === 1 && c.slug !== "sets",
  );

  const linkCls =
    "whitespace-nowrap text-sm font-medium text-[#222222] transition-colors duration-150 hover:text-[#5332C9]";

  return (
    <nav className="hidden md:flex items-center gap-6" aria-label="주요 메뉴">
      <Link href="/products?view=new" className={linkCls}>
        신상품
      </Link>

      <Link href="/products?view=top10" className={linkCls}>
        Top 10
      </Link>

      {/* 전체상품 드롭다운 */}
      <div className="group relative">
        <Link
          href="/products"
          className={`${linkCls} inline-flex items-center gap-1`}
        >
          전체상품
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:rotate-180"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Link>

        {overviewChildren.length > 0 && (
          <div className="invisible absolute left-1/2 top-full z-50 min-w-[160px] -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
            <div className="rounded-2xl border border-[#E8E6E1] bg-white py-2 shadow-xl shadow-black/5">
              <Link
                href="/products"
                className="block px-4 py-2.5 text-sm text-[#222222] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]"
              >
                전체보기
              </Link>
              <div className="mx-4 my-1 h-px bg-[#E8E6E1]" />
              {overviewChildren.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="block px-4 py-2.5 text-sm text-[#222222] transition-colors hover:bg-[#FAF9F6] hover:text-[#5332C9]"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {setCategory ? (
        <Link href={`/categories/${setCategory.slug}`} className={linkCls}>
          {setCategory.name}
        </Link>
      ) : (
        <Link
          href="/products?category=sets"
          className="whitespace-nowrap text-sm font-medium text-[#9ca3af] transition-colors hover:text-[#5332C9]"
          title="관리자에서 '세트상품' 카테고리를 등록해 주세요."
        >
          세트상품
        </Link>
      )}
    </nav>
  );
}
