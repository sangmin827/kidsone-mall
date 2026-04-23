import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/src/lib/supabase/server";
import ProductsToolbar from "@/src/components/products/ProductsToolbar";
import WishlistIconButton from "@/src/components/product/WishlistIconButton";
import { getWishlistProductIds } from "@/src/server/wishlist";

type SortKey = "new" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    view?: string;
    category?: string;
  }>;
};

function normalizeSort(value: string | undefined): SortKey {
  switch (value) {
    case "price_asc": case "price_desc": case "name_asc": case "name_desc": case "new":
      return value;
    default:
      return "new";
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q, sort, view, category } = await searchParams;
  const sortKey = normalizeSort(sort);
  const isTop10 = view === "top10";
  const isNewView = view === "new";
  const searchTerm = (q ?? "").trim();
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`id, name, slug, price, is_new, top10_rank, is_sold_out, hide_when_sold_out, product_images(image_url, is_thumbnail, sort_order)`)
    .eq("is_active", true)
    .or("is_sold_out.eq.false,hide_when_sold_out.eq.false");

  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`);
  query = query.eq("is_set", false);

  if (category) {
    const { data: categoryRow } = await supabase.from("categories").select("id").eq("slug", category).maybeSingle();
    if (categoryRow?.id) query = query.eq("category_id", categoryRow.id);
  }

  if (isTop10) {
    query = query
      .not("top10_rank", "is", null)
      .order("top10_rank", { ascending: true })
      .limit(100);
  } else {
    if (isNewView) query = query.eq("is_new", true);
    if (sortKey === "new") {
      query = query.order("id", { ascending: false });
    } else {
      const colMap: Record<string, { col: string; asc: boolean }> = {
        price_asc:  { col: "price", asc: true  },
        price_desc: { col: "price", asc: false },
        name_asc:   { col: "name",  asc: true  },
        name_desc:  { col: "name",  asc: false },
      };
      const { col, asc } = colMap[sortKey] ?? { col: "id", asc: false };
      query = query.order(col, { ascending: asc });
    }
  }

  const [{ data: products, error }, wishlistIds] = await Promise.all([
    query,
    getWishlistProductIds(),
  ]);

  const heading = isTop10 ? "Top 10 인기상품" : isNewView ? "신상품" : "전체 상품 목록";

  const emptyMessage = isNewView
    ? { title: "등록된 신상품이 없습니다", sub: "관리자에서 상품에 신상품 표시를 설정해 주세요." }
    : searchTerm
    ? { title: `'${searchTerm}'에 대한 결과가 없어요`, sub: "다른 검색어로 시도해 보세요." }
    : { title: "등록된 상품이 없습니다", sub: "곧 새로운 상품이 등록될 예정이에요!" };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="bg-white border-b border-[#E8E6E1]">
        <div className="section-inner py-6 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="section-title">{heading}</h1>
              {searchTerm && (
                <p className="mt-1 text-sm text-[#6b7280]">
                  <span className="font-semibold text-[#222222]">&ldquo;{searchTerm}&rdquo;</span> 검색 결과&nbsp;
                  <span className="font-semibold text-[#5332C9]">{products?.length ?? 0}건</span>
                </p>
              )}
            </div>
            {isTop10 && (
              <div className="flex items-center gap-2 rounded-full bg-[#fff0f0] px-4 py-1.5">
                <span className="text-sm">🏆</span>
                <span className="text-xs font-semibold text-[#FF5555]">인기 순위 기준</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section-inner py-6 sm:py-8">
        <Suspense fallback={<div className="mb-4 h-10 w-full animate-pulse rounded-xl bg-[#E8E6E1]" />}>
          <ProductsToolbar />
        </Suspense>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-600">상품을 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-red-400">잠시 후 다시 시도해 주세요.</p>
          </div>
        )}

        {!error && (!products || products.length === 0) && (
          <div className="mt-10 flex flex-col items-center justify-center gap-5 rounded-3xl border border-[#E8E6E1] bg-white py-16 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF9F6] text-4xl">
              {isNewView ? "✨" : "🔍"}
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-bold text-[#222222]">{emptyMessage.title}</p>
              <p className="text-sm text-[#6b7280]">{emptyMessage.sub}</p>
            </div>
            <Link href="/products" className="btn-outline mt-2">전체 상품 보기</Link>
          </div>
        )}

        {!error && products && products.length > 0 && (
          <>
            <p className="mb-4 text-sm text-[#9ca3af]">총 {products.length}개의 상품</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                const thumbnail =
                  product.product_images?.find((img: { is_thumbnail: boolean | null }) => img.is_thumbnail)?.image_url ??
                  product.product_images?.[0]?.image_url ??
                  "/placeholder.png";

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group relative block overflow-hidden rounded-2xl bg-white border border-[#E8E6E1] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#f5f4f1]">
                      <Image
                        src={thumbnail}
                        alt={product.name}
                        fill
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${product.is_sold_out ? "opacity-60" : ""}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute left-2 top-2 flex flex-col gap-1">
                        {product.top10_rank !== null && <span className="badge-top">TOP {product.top10_rank}</span>}
                        {product.is_new && <span className="badge-new">NEW</span>}
                      </div>
                      {product.is_sold_out && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                          <span className="badge-sold-out">품절</span>
                        </div>
                      )}
                      <WishlistIconButton
                        productId={product.id}
                        initialWishlisted={wishlistIds.has(product.id)}
                        className="absolute bottom-2 right-2 z-10"
                      />
                    </div>
                    <div className="px-3 py-3">
                      <h2 className="line-clamp-2 text-sm font-medium leading-snug text-[#222222]">{product.name}</h2>
                      <p className="mt-1.5 text-base font-bold text-[#222222]">
                        {product.price.toLocaleString()}<span className="ml-0.5 text-sm font-normal text-[#6b7280]">원</span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
