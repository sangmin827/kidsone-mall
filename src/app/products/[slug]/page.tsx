import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import ProductPurchaseBox from "@/src/components/product/ProductPurchaseBox";
import { getMyCart } from "@/src/server/cart";

type ProductImage = {
  image_url: string;
  is_thumbnail: boolean | null;
  sort_order: number | null;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  short_description: string | null;
  description: string | null;
  stock: number | null;
  product_images: ProductImage[] | null;
};

async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      price,
      short_description,
      description,
      stock,
      product_images (
        image_url,
        is_thumbnail,
        sort_order
      )
      `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

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

  if (!product) {
    notFound();
  }

  const cartItemCount = cartResult.items.length;
  const isLoggedIn = !!authData.user;

  const images =
    product.product_images?.sort(
      (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999),
    ) ?? [];

  const mainImage =
    images.find((img) => img.is_thumbnail)?.image_url ??
    images[0]?.image_url ??
    "/placeholder.png";

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={mainImage}
              alt={product.name}
              width={800}
              height={800}
              className="h-auto w-full object-cover"
              priority
            />
          </div>

          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.map((img, index) => (
                <div
                  key={`${img.image_url}-${index}`}
                  className="overflow-hidden rounded-xl bg-gray-100"
                >
                  <Image
                    src={img.image_url}
                    alt={`${product.name} ${index + 1}`}
                    width={200}
                    height={200}
                    className="h-24 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {product.short_description && (
              <p className="text-base text-gray-600">
                {product.short_description}
              </p>
            )}

            <p className="text-2xl font-bold text-gray-900">
              {product.price.toLocaleString()}원
            </p>

            <p className="text-sm text-gray-500">
              재고: {product.stock ?? 0}개
            </p>
          </div>

          <ProductPurchaseBox
            productId={product.id}
            price={product.price}
            stock={product.stock ?? 0}
            cartItemCount={cartItemCount}
            isLoggedIn={isLoggedIn}
          />

          {product.description && (
            <div className="rounded-2xl border border-gray-200 p-5">
              <h2 className="mb-3 text-lg font-semibold">상품 설명</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
