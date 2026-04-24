import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: newProducts } = await supabase
    .from("products")
    .select(
      `id, name, slug, price, is_new, is_sold_out, top10_rank, product_images(image_url, is_thumbnail, sort_order)`,
    )
    .eq("is_active", true)
    .or("is_sold_out.eq.false,hide_when_sold_out.eq.false")
    .order("is_new", { ascending: false })
    .order("id", { ascending: false })
    .limit(8);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, level")
    .eq("is_active", true)
    .eq("level", 1)
    .order("sort_order", { ascending: true })
    .limit(6);

  const catIcons = [
    "/icon/large-tool.svg",
    "/icon/small-tool.svg",
    "/icon/sports.svg",
    "/icon/season.svg",
  ];
  const catColors = [
    "bg-[#fdecec]",
    "bg-[#fdf5ec]",
    "bg-[#fdfcec]",
    "bg-[#f1fdec]",
  ];

  return (
    <main className="flex flex-col">
      {/*
       * 레이아웃 순서 전략:
       *   모바일  → 카테고리(order-1) → 신상품(order-2) → Hero(order-3) → CTA(order-4) → Features(order-5)
       *   PC/Tab  → Hero(md:order-1) → 카테고리(md:order-2) → 신상품(md:order-3) → ...
       *)

      {/* ━━━ 1. 카테고리 퀵링크 ━━━ */}
      {categories && categories.length > 0 && (
        <section className="order-1 md:order-2 bg-white border-b border-[#E8E6E1]">
          <div className="section-inner py-4 md:py-5">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide md:gap-5">
              <Link
                href="/products"
                className="flex-none flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-[#eeecfd] transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
                  <Image
                    src="/icon/all-products.svg"
                    alt="전체상품"
                    width={34}
                    height={34}
                    className="h-8 w-8 md:h-9 md:w-9"
                  />
                </div>
                <span className="text-[11px] md:text-xs font-medium text-[#222222] whitespace-nowrap">
                  전체
                </span>
              </Link>

              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="flex-none flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className={`flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl ${catColors[i % catColors.length]} transition-transform duration-150 group-hover:scale-105 group-active:scale-95`}
                  >
                    <Image
                      src={catIcons[i % catIcons.length]}
                      alt={cat.name}
                      width={34}
                      height={34}
                      className="h-8 w-8 md:h-9 md:w-9"
                    />
                  </div>
                  <span className="text-[11px] md:text-xs font-medium text-[#222222] whitespace-nowrap">
                    {cat.name}
                  </span>
                </Link>
              ))}
              <Link
                href="/sets"
                className="flex-none flex flex-col items-center gap-1.5 group"
              >
                <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-[#ecf9fd] transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
                  <Image
                    src="/icon/set.svg"
                    alt="세트상품"
                    width={34}
                    height={34}
                    className="h-8 w-8 md:h-9 md:w-9"
                  />
                </div>
                <span className="text-[11px] md:text-xs font-medium text-[#222222] whitespace-nowrap">
                  세트상품
                </span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ━━━ 2. Hero ━━━ */}
      <section className="order-3 md:order-1 relative overflow-hidden bg-white">
        {/* PC 전용 장식 블롭 */}
        <div
          aria-hidden="true"
          className="pointer-events-none hidden md:block absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#ede9fb] opacity-60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none hidden md:block absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#fff0f0] opacity-50 blur-3xl"
        />

        <div className="section-inner relative">
          {/* ── 모바일 전용 Hero: 가로형 미니 배너 ── */}
          <div className="flex items-center gap-4 py-5 md:hidden">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ede9fb] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5332C9]" />
                <span className="text-[10px] font-semibold text-[#5332C9]">
                  2025 New
                </span>
              </div>
              <h1 className="font-gmarket text-xl font-bold leading-snug text-[#222222]">
                아이들의 성장을
                <br />
                <span className="text-[#5332C9]">즐겁게</span> 만드는 놀이도구
              </h1>
              <div className="flex gap-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 rounded-xl bg-[#FF5555] px-4 py-2.5 text-xs font-bold text-white active:scale-[0.97] transition-transform"
                >
                  상품보기
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link
                  href="/products?view=top10"
                  className="inline-flex items-center rounded-xl border border-[#E8E6E1] bg-white px-4 py-2.5 text-xs font-medium text-[#222222] active:scale-[0.97] transition-transform"
                >
                  Top 10
                </Link>
              </div>
            </div>
            <div className="flex-none relative w-24 h-24 overflow-hidden rounded-2xl bg-[#FAF9F6]">
              <Image
                src="/kids-one-logo.png"
                alt="Kids One"
                fill
                className="object-contain p-3 opacity-80"
                priority
                sizes="96px"
              />
              <div className="absolute -top-1 -right-1 rounded-lg bg-[#FF5555] px-2 py-1 shadow">
                <p className="text-[9px] font-black text-white">신상품!</p>
              </div>
            </div>
          </div>

          {/* ── 태블릿/PC 전용 Hero: 풀 레이아웃 ── */}
          <div className="hidden md:flex items-center gap-10 lg:gap-16 py-16 lg:py-20">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ede9fb] px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5332C9]" />
                <span className="text-xs font-semibold text-[#5332C9]">
                  New Collection 2026
                </span>
              </div>
              <h1 className="font-gmarket text-4xl font-bold leading-tight text-[#222222] lg:text-[50px]">
                아이들의 성장을
                <br />
                <span className="text-[#5332C9]">즐겁게</span> 만드는
                <br />
                놀이도구
              </h1>
              <p className="text-base leading-7 text-[#6b7280] lg:text-lg">
                유아체육 전문 쇼핑몰 Kids One Mall.
                <br />
                아이의 발달에 맞는 안전하고 재미있는 체육 놀이도구를 만나보세요.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="btn-primary gap-2 text-base px-6 py-3.5"
                >
                  상품 보러가기
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link
                  href="/products?view=top10"
                  className="btn-ghost text-base px-6 py-3.5"
                >
                  인기 Top 10
                </Link>
              </div>
            </div>
            <div className="flex-none w-72 lg:w-90">
              <div className="relative overflow-hidden rounded-3xl bg-[#FAF9F6] aspect-square">
                <Image
                  src="/kids-one-img.png"
                  alt="Kids One Mall"
                  fill
                  className="object-contain p-12 opacity-80"
                  priority
                  sizes="320px"
                />
                <div className="absolute -right-3 top-8 rounded-2xl bg-[#FF5555] px-4 py-2 shadow-lg">
                  <p className="text-xs font-bold text-white">신상품</p>
                  <p className="text-lg font-black text-white leading-tight">
                    입고!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 3. 신상품 그리드 ━━━ */}
      {newProducts && newProducts.length > 0 && (
        <section className="order-2 md:order-3 py-6 md:py-14">
          <div className="section-inner">
            <div className="flex items-end justify-between mb-4 md:mb-8">
              <div>
                <h2 className="text-xl font-bold text-[#222222] font-gmarket md:text-3xl">
                  신상품
                </h2>
                <p className="mt-1 text-xs text-[#6b7280] md:text-sm">
                  가장 새로운 체육 놀이도구를 만나보세요
                </p>
              </div>
              <Link
                href="/products?view=new"
                className="flex items-center gap-1 text-xs font-semibold text-[#5332C9] hover:underline md:text-sm"
              >
                전체보기
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
            {/* 모바일 2열 / 태블릿 3열 / PC 4열 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {newProducts.map((product) => {
                const thumbnail =
                  (
                    product.product_images as
                      | { image_url: string; is_thumbnail: boolean | null }[]
                      | null
                  )?.find((img) => img.is_thumbnail)?.image_url ??
                  (
                    product.product_images as { image_url: string }[] | null
                  )?.[0]?.image_url ??
                  "/placeholder.png";

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group block overflow-hidden rounded-2xl bg-white border border-[#E8E6E1] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#f5f4f1]">
                      <Image
                        src={thumbnail}
                        alt={product.name}
                        fill
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${product.is_sold_out ? "opacity-60" : ""}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
                        {product.top10_rank !== null && (
                          <span className="badge-top">
                            TOP {product.top10_rank}
                          </span>
                        )}
                        {product.is_new && (
                          <span className="badge-new">NEW</span>
                        )}
                      </div>
                      {product.is_sold_out && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                          <span className="badge-sold-out">품절</span>
                        </div>
                      )}
                    </div>
                    <div className="px-2.5 py-2.5 md:px-3 md:py-3">
                      <h3 className="line-clamp-2 text-xs font-medium leading-snug text-[#222222] md:text-sm">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-[#222222] md:mt-1.5 md:text-base">
                        {product.price.toLocaleString()}
                        <span className="ml-0.5 text-xs font-normal text-[#6b7280]">
                          원
                        </span>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ━━━ 4. CTA 배너 ━━━ */}
      <section className="order-4 py-4 md:py-6">
        <div className="section-inner">
          <div className="overflow-hidden rounded-2xl md:rounded-3xl bg-[#5332C9] px-6 py-8 md:px-12 md:py-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#c4b9f5] md:text-xs">
                  Kids One Mall
                </p>
                <h2 className="font-gmarket text-xl font-bold text-white md:text-2xl lg:text-3xl">
                  인기 Top 10 상품 확인하기
                </h2>
                <p className="text-xs text-[#c4b9f5] md:text-sm">
                  가장 많이 찾는 유아체육 도구를 한눈에
                </p>
              </div>
              <Link
                href="/products?view=top10"
                className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#5332C9] transition-all hover:bg-[#FAF9F6] active:scale-[0.98]"
              >
                Top 10 보기
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
                  aria-hidden="true"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 5. Features — 신뢰 요소 ━━━ */}
      <section className="order-5 py-8 md:py-16 bg-white border-t border-[#E8E6E1]">
        <div className="section-inner">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl font-bold text-[#222222] font-gmarket md:text-3xl">
              Kids One Mall에 오신걸 환영합니다!
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              {
                icon: "👨‍👩‍👧",
                title: "전문가 추천",
                desc: "유아체육 전문가가 직접 사용하고 추천한 도구들로 구성됩니다.",
                color: "bg-[#fff0f0]",
                textColor: "text-[#FF5555]",
              },
              {
                icon: "📦",
                title: "꼼꼼한 포장",
                desc: "파손 없이 안전하게 도착할 수 있도록 꼼꼼히 포장해서 보내드리겠습니다.",
                color: "bg-[#fef9ec]",
                textColor: "text-[#D4AF37]",
              },
              {
                icon: "💬",
                title: "카카오톡 상담",
                desc: "궁금한 점은 카카오톡으로 빠르게 답변 받으실 수 있습니다.",
                color: "bg-[#FEE500]/30",
                textColor: "text-[#7a6600]",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center gap-3 rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] p-5 text-center md:p-6"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color}`}
                >
                  <span className="text-2xl md:text-3xl">{feature.icon}</span>
                </div>
                <div>
                  <p
                    className={`text-sm font-bold md:text-base ${feature.textColor}`}
                  >
                    {feature.title}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#6b7280] md:text-xs md:leading-6">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
