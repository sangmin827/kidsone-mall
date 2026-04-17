"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  removeCartItemAction,
  setCartItemQuantityAction,
} from "@/src/app/mypage/cart/actions";

type ProductImage = {
  image_url: string;
  is_thumbnail: boolean | null;
  sort_order: number | null;
};

type CartProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  product_images: ProductImage[] | null;
};

type CartItem = {
  id: number;
  quantity: number;
  products: CartProduct | null;
};

type Props = {
  initialItems: CartItem[];
};

export default function CartClient({ initialItems }: Props) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [errorMessage, setErrorMessage] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  );
  const latestItemsRef = useRef<CartItem[]>(initialItems);

  useEffect(() => {
    latestItemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

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

  const clampQuantity = (value: number, stock: number) => {
    if (Number.isNaN(value)) return 1;
    if (value < 1) return 1;
    if (stock > 0 && value > stock) return stock;
    return value;
  };

  const syncQuantityToServer = (cartItemId: number, quantity: number) => {
    if (debounceTimers.current[cartItemId]) {
      clearTimeout(debounceTimers.current[cartItemId]);
    }

    debounceTimers.current[cartItemId] = setTimeout(async () => {
      const prevItems = latestItemsRef.current;

      const formData = new FormData();
      formData.set("cartItemId", String(cartItemId));
      formData.set("quantity", String(quantity));

      const result = await setCartItemQuantityAction(formData);

      if (!result.ok) {
        setItems(prevItems);
        setErrorMessage(result.message);
        toast.error(result.message, {
          id: `cart-qty-${cartItemId}`,
          duration: 2000,
        });
      }
    }, 250);
  };

  const updateLocalQuantity = (cartItemId: number, nextQuantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === cartItemId ? { ...item, quantity: nextQuantity } : item,
      ),
    );
    setErrorMessage("");
    syncQuantityToServer(cartItemId, nextQuantity);
  };

  const handleIncrease = (item: CartItem) => {
    const product = item.products;
    if (!product) return;
    if (product.stock <= 0) return;
    if (item.quantity >= product.stock) return;

    const next = Math.min(product.stock, item.quantity + 1);
    updateLocalQuantity(item.id, next);
  };

  const handleDecrease = (item: CartItem) => {
    const product = item.products;
    if (!product) return;
    if (item.quantity <= 1) return;

    const next = Math.max(1, item.quantity - 1);
    updateLocalQuantity(item.id, next);
  };

  const handleInputChange = (
    cartItemId: number,
    value: string,
    stock: number,
  ) => {
    const next = value === "" ? 1 : clampQuantity(Number(value), stock);

    setItems((current) =>
      current.map((item) =>
        item.id === cartItemId ? { ...item, quantity: next } : item,
      ),
    );
  };

  const handleInputCommit = (item: CartItem) => {
    const product = item.products;
    if (!product) return;

    const next = clampQuantity(item.quantity, product.stock);
    updateLocalQuantity(item.id, next);
  };

  const handleRemove = async (cartItemId: number) => {
    const prevItems = latestItemsRef.current;

    if (debounceTimers.current[cartItemId]) {
      clearTimeout(debounceTimers.current[cartItemId]);
      delete debounceTimers.current[cartItemId];
    }

    setRemovingId(cartItemId);
    setItems((current) => current.filter((item) => item.id !== cartItemId));
    setErrorMessage("");

    const formData = new FormData();
    formData.set("cartItemId", String(cartItemId));

    const result = await removeCartItemAction(formData);

    if (result.ok) {
      toast.success("장바구니에서 삭제했습니다.", {
        id: `cart-remove-${cartItemId}`,
        duration: 1500,
      });
    } else {
      setItems(prevItems);
      setErrorMessage(result.message);
      toast.error(result.message, {
        id: `cart-remove-${cartItemId}`,
        duration: 2500,
      });
    }

    setRemovingId(null);
  };

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
                            ? "품절된 상품입니다."
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

                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          disabled={item.quantity <= 1}
                          className="h-9 w-9 rounded-lg border text-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={product.stock > 0 ? product.stock : 1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleInputChange(
                              item.id,
                              e.target.value,
                              product.stock,
                            )
                          }
                          onBlur={() => handleInputCommit(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className="h-9 w-20 rounded-lg border text-center text-sm font-semibold outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          disabled={isSoldOut || item.quantity >= product.stock}
                          className="h-9 w-9 rounded-lg border text-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={removingId === item.id}
                      className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}

            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
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
                  ? "pointer-events-none bg-gray-400"
                  : "bg-black"
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
