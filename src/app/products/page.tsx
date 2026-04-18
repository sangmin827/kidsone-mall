import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import ProductsToolbar from "@/src/components/products/ProductsToolbar";

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
    case "price_asc":
    case "price_desc":
    case "name_asc":
    case "name_desc":
    case "new":
      return value;
    default:
      return "new";
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q, sort, view, category } = await searchParams;

  const sortKey = normalizeSort(sort);
  const isTop10 = view === "top10";
  const searchTerm = (q ?? "").trim();

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      price,
      short_description,
      category_id,
      is_new,
      top10_rank,
      is_sold_out,
      hide_when_sold_out,
      product_images (
        image_url,
        is_thumbnail,
        sort_order
      )
      `,
    )
    .eq("is_active", true)
    // 품절 + 목록 숨김이 동시에 켜진 상품은 목록에서 제외
    // (즉 is_sold_out=true && hide_when_sold_out=true 인 상품만 숨김)
    .or("is_sold_out.eq.false,hide_when_sold_out.eq.false");

  // 검색어
  if (searchTerm) {
    query = query.ilike("name", `%${searchTerm}%`);
  }

  // 카테고리 slug 필터
  if (category) {
    const { data: categoryRow } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .maybeSingle();

    if (categoryRow?.id) {
      query = query.eq("category_id", categoryRow.id);
    }
  }

  // Top 10 페이지: top10_rank 가 지정된 모든 상품 (1~100위) 을 순위순으로.
  // 1~10위는 홈화면에도 노출되고, 이 페이지에서는 11~100위까지 풀로 보여준다.
  // 신상품(기본 sort=new): is_new 플래그가 켜진 상품 우선, 그 외는 생성 역순
  if (isTop10) {
    query = query
      .not("top10_rank", "is", null)
      .order("top10_rank", { ascending: true })
      .limit(100);
  } else if (sortKey === "new") {
    // is_new = true 먼저, 그 안에서 id 역순 (= 최근 등록 먼저)
    query = query
      .order("is_new", { ascending: false })
      .order("id", { ascending: false });
  } else {
    switch (sortKey) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "name_asc":
        query = query.order("name", { ascending: true });
        break;
      case "name_desc":
        query = query.order("name", { ascending: false });
        break;
    }
  }

  const { data: products, error } = await query;

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p>상품을 불러오지 못했습니다.</p>
      </main>
    );
  }

  const heading = isTop10
    ? "Top 10 인기상품"
    : sortKey === "new"
      ? "신상품"
      : "상품목록";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-gmarket">{heading}</h1>

          {searchTerm && (
            <p className="text-sm text-gray-500">
              &ldquo;{searchTerm}&rdquo; 검색 결과 {products?.length ?? 0}건
            </p>
          )}
        </div>

        <ProductsToolbar />

        {(!products || products.length === 0) ? (
          <p className="mt-16 text-center text-gray-500">
            {searchTerm
              ? "검색 결과가 없습니다."
              : "등록된 상품이 없습니다."}
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const thumbnail =
                product.product_images?.find((img) => img.is_thumbnail)
                  ?.image_url ??
                product.product_images?.[0]?.image_url ??
                "/placeholder.png";

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block overflow-hidden rounded-2xl bg-white transition hover:shadow-md"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      width={400}
                      height={300}
                      className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
                        product.is_sold_out ? "opacity-60" : ""
                      }`}
                    />

                    {/* 배지 영역 */}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      {product.top10_rank !== null && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                          TOP {product.top10_rank}
                        </span>
                      )}
                      {product.is_new && (
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                          신상품
                        </span>
                      )}
                    </div>

                    {/* 품절 오버레이 */}
                    {product.is_sold_out && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-rose-600/90 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                          품절
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 px-3 py-3">
                    <h2 className="line-clamp-1 text-sm font-medium text-gray-900">
                      {product.name}
                    </h2>

                    <p className="text-base font-semibold text-gray-900">
                      {product.price.toLocaleString()}원
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
