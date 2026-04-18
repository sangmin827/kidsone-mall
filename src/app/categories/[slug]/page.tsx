import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import ProductsToolbar from "@/src/components/products/ProductsToolbar";

type SortKey = "new" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
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

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { q, sort } = await searchParams;
  const supabase = await createClient();

  const sortKey = normalizeSort(sort);
  const searchTerm = (q ?? "").trim();

  // 1) 카테고리 조회 (해당 slug + 그 하위 카테고리 id 까지 모아서 상품 검색)
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", category.id)
    .eq("is_active", true);

  const categoryIds = [category.id, ...(children ?? []).map((c) => c.id)];

  // 2) 상품 쿼리 조립 (검색/정렬/품절 숨김 규칙은 /products 와 동일한 규약 유지)
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
    .in("category_id", categoryIds)
    .eq("is_active", true)
    .or("is_sold_out.eq.false,hide_when_sold_out.eq.false");

  if (searchTerm) {
    query = query.ilike("name", `%${searchTerm}%`);
  }

  if (sortKey === "new") {
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

  const { data: products, error: productsError } = await query;

  if (productsError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <p className="mt-4">상품을 불러오지 못했습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-gmarket">{category.name}</h1>
          {searchTerm && (
            <p className="text-sm text-gray-500">
              &ldquo;{searchTerm}&rdquo; 검색 결과 {products?.length ?? 0}건
            </p>
          )}
        </div>

        <ProductsToolbar />

        {!products || products.length === 0 ? (
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

                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      {product.top10_rank !== null &&
                        product.top10_rank <= 10 && (
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
