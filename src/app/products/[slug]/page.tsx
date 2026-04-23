import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import ProductPurchaseBox from "@/src/components/product/ProductPurchaseBox";
import SoldOutBox from "@/src/components/product/SoldOutBox";
import ProductImageGallery from "@/src/components/product/ProductImageGallery";
import WishlistButton from "@/src/components/product/WishlistButton";
import { getMyCart } from "@/src/server/cart";
import { getWishlistStatus } from "@/src/server/wishlist";
import Link from "next/link";

type ProductImage = {
  image_url: string;
  is_thumbnail: boolean | null;
  sort_order: number | null;
  image_type: string;
};
type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  short_description: string | null;
  description: string | null;
  stock: number | null;
  is_sold_out: boolean | null;
  hide_when_sold_out: boolean | null;
  product_images: ProductImage[] | null;
};

async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, slug, price, short_description, description, stock, is_sold_out, hide_when_sold_out,
       product_images(image_url, is_thumbnail, sort_order, image_type)`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return data as Product;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data: authData }, product, cartResult] = await Promise.all([
    supabase.auth.getUser(),
    getProductBySlug(slug),
    getMyCart(),
  ]);

  if (!product) notFound();
  if (product.is_sold_out && product.hide_when_sold_out) notFound();

  const cartItemCount = cartResult.items.length;
  const isLoggedIn = !!authData.user;
  const isSoldOut = !!product.is_sold_out;

  // 갤러리 이미지 / 상세 이미지 분리
  const allImages = product.product_images?.sort(
    (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999),
  ) ?? [];
  const galleryImages = allImages.filter((img) => img.image_type !== "detail");
  const detailImages  = allImages.filter((img) => img.image_type === "detail");

  // 찜 상태 (비로그인이면 false)
  const isWishlisted = isLoggedIn
    ? await getWishlistStatus(product.id)
    : false;

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E8E6E1]">
        <div className="section-inner py-3">
          <nav
            className="flex items-center gap-2 text-xs text-[#9ca3af]"
            aria-label="경로"
          >
            <Link href="/" className="hover:text-[#5332C9] transition-colors">홈</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#5332C9] transition-colors">상품목록</Link>
            <span>/</span>
            <span className="text-[#222222] font-medium line-clamp-1 max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <section className="section-inner py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* 이미지 갤러리 */}
          <ProductImageGallery
            images={galleryImages}
            productName={product.name}
            isSoldOut={isSoldOut}
          />

          {/* 상품 정보 */}
          <div className="space-y-5">
            <div className="space-y-3">
              {isSoldOut && <span className="badge-sold-out">품절</span>}
              <h1 className="text-2xl font-bold leading-snug text-[#222222] sm:text-3xl">
                {product.name}
              </h1>
              {product.short_description && (
                <p className="text-base text-[#6b7280] leading-7">
                  {product.short_description}
                </p>
              )}
              <div className="rounded-2xl bg-white border border-[#E8E6E1] px-5 py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#222222]">
                    {product.price.toLocaleString()}
                  </span>
                  <span className="text-lg text-[#6b7280]">원</span>
                </div>
                <p className="mt-1 text-xs text-[#9ca3af]">무통장입금 결제</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-[#E8E6E1] p-5">
              {isSoldOut ? (
                <SoldOutBox productId={product.id} />
              ) : (
                <ProductPurchaseBox
                  productId={product.id}
                  price={product.price}
                  stock={product.stock ?? 0}
                  cartItemCount={cartItemCount}
                  isLoggedIn={isLoggedIn}
                />
              )}
            </div>

            {/* 찜하기 버튼 */}
            <WishlistButton
              productId={product.id}
              initialWishlisted={isWishlisted}
              isLoggedIn={isLoggedIn}
            />

            <div className="rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] px-5 py-4 space-y-2">
              {[
                { icon: "🚚", text: "주문 확인 후 1~2주 정도 소요될수 있습니다" },
                { icon: "💳", text: "무통장입금 — 입금자명과 주문자명을 동일하게 입력해 주세요" },
                { icon: "🔒", text: "안전 인증 완료 제품" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">{item.icon}</span>
                  <span className="text-xs leading-5 text-[#6b7280]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 텍스트 상품 설명 */}
        {product.description && (
          <div className="mt-10 rounded-3xl border border-[#E8E6E1] bg-white p-6 sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-[#222222]">상품 설명</h2>
            <div className="divider mb-5" />
            <p className="whitespace-pre-line text-sm leading-8 text-[#6b7280]">
              {product.description}
            </p>
          </div>
        )}

        {/* 상세 이미지 — 스마트스토어 스타일 */}
        {detailImages.length > 0 && (
          <div className="mt-6 overflow-hidden rounded-3xl border border-[#E8E6E1] bg-white">
            {(!product.description) && (
              <div className="border-b border-[#E8E6E1] px-6 py-4 sm:px-8">
                <h2 className="text-lg font-bold text-[#222222]">상품 상세</h2>
              </div>
            )}
            {detailImages.map((img, i) => (
              <div key={i} className="relative w-full">
                <Image
                  src={img.image_url}
                  alt={`${product.name} 상세 이미지 ${i + 1}`}
                  width={1200}
                  height={0}
                  style={{ height: "auto", width: "100%" }}
                  className="block"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link href="/products" className="btn-ghost inline-flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            상품목록으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
