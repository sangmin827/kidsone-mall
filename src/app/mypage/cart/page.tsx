import Link from 'next/link';
import Image from 'next/image';
import { getMyCart } from '@/src/server/cart';
import CartItemControls from '@/src/components/cart/CartItemControls';

export default async function CartPage() {
  const { items } = await getMyCart();

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = items.reduce((sum, item) => {
    const price = item.products?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const hasSoldOutItem = items.some((item) => {
    const product = item.products;
    if (!product) return false;
    return product.stock <= 0;
  });

  const hasOverStockItem = items.some((item) => {
    const product = item.products;
    if (!product) return false;
    return item.quantity > product.stock;
  });

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
                '/placeholder.png';

              const itemTotal = product.price * item.quantity;
              const isSoldOut = product.stock <= 0;
              const isOverStock = item.quantity > product.stock;

              return (
                <div key={item.id} className="rounded-2xl border bg-white p-4">
                  <div className="flex gap-4">
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
                        단가: {product.price.toLocaleString()}원
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        재고: {product.stock}개
                      </p>

                      {(isSoldOut || isOverStock) && (
                        <p className="mt-2 text-sm font-medium text-red-500">
                          {isSoldOut
                            ? '품절된 상품입니다.'
                            : `재고보다 많이 담겨 있습니다. 현재 재고: ${product.stock}개`}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">상품 합계</p>
                      <p className="font-semibold">
                        {itemTotal.toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  <CartItemControls
                    cartItemId={item.id}
                    initialQuantity={item.quantity}
                    stock={product.stock}
                    isSoldOut={isSoldOut}
                  />
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-bold">주문 요약</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>총 상품 수량</span>
                <span>{totalQuantity}개</span>
              </div>

              <div className="flex items-center justify-between">
                <span>총 상품금액</span>
                <span>{totalAmount.toLocaleString()}원</span>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between font-semibold">
                <span>총 결제금액</span>
                <span>{totalAmount.toLocaleString()}원</span>
              </div>
            </div>

            {(hasSoldOutItem || hasOverStockItem) && (
              <p className="mt-4 text-sm font-medium text-red-500">
                품절 또는 재고 초과 상품이 있어 주문할 수 없습니다.
              </p>
            )}

            <Link
              href="/checkout?mode=cart"
              className={`mt-6 block w-full rounded-xl px-4 py-3 text-center text-white ${
                hasSoldOutItem || hasOverStockItem
                  ? 'pointer-events-none bg-gray-400'
                  : 'bg-black'
              }`}
            >
              주문하기
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
