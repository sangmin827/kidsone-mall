import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/src/lib/supabase/server';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from('products')
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
    .eq('is_active', true)
    .order('id', { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p>상품을 불러오지 못했습니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-bold font-gmarket">상품목록</h1>

        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products?.map((product) => {
            const thumbnail =
              product.product_images?.find((img) => img.is_thumbnail)
                ?.image_url ??
              product.product_images?.[0]?.image_url ??
              '/placeholder.png';

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
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
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
      </section>
    </main>
  );
}
