import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "세트상품 | Kids One Mall",
  description: "Kids One Mall의 기획 세트 상품을 만나보세요. 알뜰하고 구성 좋은 유아체육 세트.",
};

type SortKey = "new" | "price_asc" | "price_desc" | "name_asc" | "name_desc";

function normalizeSort(value: string | undefined): SortKey {
  switch (value) {
    case "price_asc": case "price_desc": case "name_asc": case "name_desc": case "new":
      return value;
    default:
      return "new";
  }
}

export default async function SetsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortKey = normalizeSort(sort);
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, is_new, is_sold_out, hide_when_sold_out, short_description, product_images(image_url, is_thumbnail, sort_order)"
    )
    .eq("is_active", true)
    .eq("is_set", true)
    .or("is_sold_out.eq.false,hide_when_sold_out.eq.false");

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

  const { data: products, error } = await query;

  const sortOptions: { value: string; label: string }[] = [
    { value: "new",        label: "최신순"    },
    { value: "price_asc",  label: "낮은 가격순" },
    { value: "price_desc", label: "높은 가격순" },
    { value: "name_asc",   label: "이름순 (가)"  },
    { value: "name_desc",  label: "이름순 (하)"  },
  ];

  return (
    <main className="min-h-screen bg-[#FAF9F6]">

      {/* 헤더 */}
      <div className="bg-white border-b border-[#E8E6E1]">
        <div className="section-inner py-6 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎁</span>
                <h1 className="section-title">세트 상품</h1>
              </div>
              <p className="mt-1 text-sm text-[#6b7280]">
                알뜰하게 구성된 유아체육 기획 세트를 만나보세요.
              </p>
            </div>
            {products && products.length > 0 && (
              <span className="rounded-full bg-[#ede9fb] px-4 py-1.5 text-xs font-semibold text-[#5332C9]">
                총 {products.length}개 세트
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="section-inner py-6 sm:py-8">

        {/* 정렬 */}
        {products && products.length > 0 && (
          <div className="mb-5 flex items-center justify-end gap-2">
            <span className="text-xs text-[#9ca3af]">정렬:</span>
            <div className="flex flex-wrap gap-1.5">
              {sortOptions.map((opt) => (
                <Link
                  key={opt.value}
                  href={`/sets?sort=${opt.value}`}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    sortKey === opt.value
                      ? "border-[#5332C9] bg-[#5332C9] text-white"
                      : "border-[#E8E6E1] bg-white text-[#6b7280] hover:border-[#5332C9] hover:text-[#5332C9]"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="text-sm font-medium text-red-600">세트 상품을 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-red-400">잠시 후 다시 시도해 주세요.</p>
          </div>
        )}

        {/* 빈 상태 */}
        {!error && (!products || products.length === 0) && (
          <div className="mt-10 flex flex-col items-center justify-center gap-5 rounded-3xl border border-[#E8E6E1] bg-white py-16 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ede9fb] text-4xl">
              🎁
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-bold text-[#222222]">아직 등록된 세트 상품이 없어요</p>
              <p className="text-sm text-[#6b7280]">곧 특별한 세트 구성으로 찾아올게요!</p>
            </div>
            <Link href="/products" className="btn-outline mt-2">전체 상품 보기</Link>
          </div>
        )}

        {/* 상품 그리드 */}
        {!error && products && products.length > 0 && (
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
                  className="group block overflow-hidden rounded-2xl bg-white border border-[#E8E6E1] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="relative aspect-square overflow-hidden bg-[#f5f4f1]">
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      fill
                      className={`object-cover transition-transform duration-300 group-hover:scale-105 ${product.is_sold_out ? "opacity-60" : ""}`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* 세트 배지 */}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#5332C9] px-2 py-0.5 text-[10px] font-bold text-white">
                        🎁 세트
                      </span>
                      {product.is_new && <span className="badge-new">NEW</span>}
                    </div>
                    {product.is_sold_out && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <span className="badge-sold-out">품절</span>
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <h2 className="line-clamp-2 text-sm font-medium leading-snug text-[#222222]">
                      {product.name}
                    </h2>
                    {product.short_description && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[#9ca3af]">
                        {product.short_description}
                      </p>
                    )}
                    <p className="mt-1.5 text-base font-bold text-[#222222]">
                      {product.price.toLocaleString()}<span className="ml-0.5 text-sm font-normal text-[#6b7280]">원</span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
