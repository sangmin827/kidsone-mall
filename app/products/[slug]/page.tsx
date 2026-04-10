import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return data;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const sortedImages =
    product.product_images?.sort((a, b) => {
      const aOrder = a.sort_order ?? 9999;
      const bOrder = b.sort_order ?? 9999;
      return aOrder - bOrder;
    }) ?? [];

  const mainImage = sortedImages[0]?.image_url ?? "/placeholder.png";

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {sortedImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {sortedImages.map((image, index) => (
                <div
                  key={`${image.image_url}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"
                >
                  <Image
                    src={image.image_url}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-extrabold">
              {product.price.toLocaleString()}원
            </p>
          </div>

          {product.short_description && (
            <p className="text-gray-600">{product.short_description}</p>
          )}

          <div className="rounded-2xl border border-gray-200 p-5">
            <h2 className="mb-3 text-lg font-semibold">상품 설명</h2>
            <p className="whitespace-pre-line text-gray-700">
              {product.description ?? "상품 설명이 아직 등록되지 않았습니다."}
            </p>
          </div>

          <button className="w-full rounded-2xl bg-black px-6 py-4 text-white transition hover:opacity-90">
            장바구니 담기
          </button>
        </div>
      </div>
    </main>
  );
}
