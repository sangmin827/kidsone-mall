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

  // 세트상품: slug === 'sets' 인 카테고리
  const setCategory = categories?.find((c) => c.slug === "sets");

  // 전체상품 드롭다운에 보여줄 자식 카테고리: 세트상품을 제외한 level 1
  const overviewChildren = (categories ?? []).filter(
    (c) => c.level === 1 && c.slug !== "sets",
  );

  return (
    <nav className="hidden md:flex items-center gap-8">
      <Link
        href="/products?sort=new"
        className="whitespace-nowrap text-sm font-medium hover:text-gray-600"
      >
        신상품
      </Link>

      <Link
        href="/products?view=top10"
        className="whitespace-nowrap text-sm font-medium hover:text-gray-600"
      >
        Top 10
      </Link>

      {/* 전체상품 + 드롭다운 */}
      <div className="group relative">
        <Link
          href="/products"
          className="inline-flex items-center whitespace-nowrap text-sm font-medium hover:text-gray-600"
        >
          전체상품
          <span className="ml-1 text-xs text-gray-400">▾</span>
        </Link>

        {overviewChildren.length > 0 && (
          <div className="invisible absolute left-1/2 top-full z-50 w-44 -translate-x-1/2 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100">
            <div className="rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
              <Link
                href="/products"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                전체보기
              </Link>
              <div className="my-1 h-px bg-gray-100" />
              {overviewChildren.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {setCategory ? (
        <Link
          href={`/categories/${setCategory.slug}`}
          className="whitespace-nowrap text-sm font-medium hover:text-gray-600"
        >
          {setCategory.name}
        </Link>
      ) : (
        <Link
          href="/products?category=sets"
          className="whitespace-nowrap text-sm font-medium text-gray-400 hover:text-gray-600"
          title="관리자에서 '세트상품' 카테고리를 등록해 주세요."
        >
          세트상품
        </Link>
      )}
    </nav>
  );
}
