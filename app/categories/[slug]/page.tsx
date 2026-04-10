import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1) 카테고리 조회
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (categoryError || !category) {
    notFound();
  }

  // 2) 해당 카테고리의 상품 조회
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      price,
      short_description,
      product_images (
        image_url,
        is_thumbnail,
        sort_order
      )
    `,
    )
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("id", { ascending: false });

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
        <h1 className="text-3xl font-bold">{category.name}</h1>

        {products.length === 0 ? (
          <p className="mt-6 text-gray-500">등록된 상품이 없습니다.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const thumbnail =
                product.product_images?.find((image) => image.is_thumbnail) ??
                product.product_images?.[0];

              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  {thumbnail?.image_url ? (
                    <img
                      src={thumbnail.image_url}
                      alt={product.name}
                      className="h-48 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                      이미지 없음
                    </div>
                  )}

                  <div className="mt-4">
                    <h2 className="font-semibold">{product.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {product.short_description}
                    </p>
                    <p className="mt-2 font-bold">
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
