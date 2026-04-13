import Link from "next/link";
import Image from "next/image";
import { getMyCart } from "@/src/server/cart";

export default async function CartPage() {
  const { items } = await getMyCart();

  const totalAmount = items.reduce((sum, item) => {
    const price = item.products?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold">장바구니</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-white p-8 text-center">
          <p className="text-gray-600">장바구니가 비어 있습니다.</p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-white"
          >
            상품 보러가기
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.products;
              if (!product) return null;

              const thumbnail =
                product.product_images?.find((img) => img.is_thumbnail)
                  ?.image_url ??
                product.product_images?.[0]?.image_url ??
                "/placeholder.png";

              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl border bg-white p-4"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={thumbnail}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-lg font-semibold"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">
                      {product.price.toLocaleString()}원
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      수량: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right font-semibold">
                    {(product.price * item.quantity).toLocaleString()}원
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-bold">주문 요약</h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>총 상품금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
            <button className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-white">
              주문하기
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
