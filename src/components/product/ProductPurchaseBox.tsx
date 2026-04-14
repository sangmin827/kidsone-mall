//src/components/product/ProductPurchaseBox.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/src/app/products/[slug]/actions";

type Props = {
  productId: number;
  price: number;
  stock: number;
  cartItemCount: number;
};

type ToastState = {
  show: boolean;
  message: string;
  type: "success" | "error";
};

export default function ProductPurchaseBox({
  productId,
  price,
  stock,
  cartItemCount,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  const [isBuyChoiceOpen, setIsBuyChoiceOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const isSoldOut = stock <= 0;
  const totalPrice = price * quantity;

  useEffect(() => {
    if (!toast.show) return;

    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast.show]);

  const normalizeQuantity = (value: number) => {
    if (Number.isNaN(value)) return 1;
    if (value < 1) return 1;
    if (stock > 0 && value > stock) return stock;
    return value;
  };

  const decrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const increase = () => {
    setQuantity((prev) => {
      if (stock <= 0) return 1;
      return Math.min(stock, prev + 1);
    });
  };

  const handleChangeQuantity = (value: string) => {
    if (value === "") {
      setQuantity(1);
      return;
    }

    const next = Number(value);
    setQuantity(normalizeQuantity(next));
  };

  const openToast = (message: string, type: "success" | "error") => {
    setToast({
      show: true,
      message,
      type,
    });
  };

  const handleAddToCart = () => {
    const formData = new FormData();
    formData.set("productId", String(productId));
    formData.set("quantity", String(quantity));

    startTransition(async () => {
      const result = await addToCartAction(formData);

      if (result.ok) {
        openToast(result.message, "success");
        router.refresh();
      } else {
        openToast(result.message, "error");
      }
    });
  };

  const goToCheckoutSingle = () => {
    router.push(
      `/checkout?mode=single&productId=${productId}&quantity=${quantity}`,
    );
  };

  const goToCheckoutWithCart = () => {
    router.push(
      `/checkout?mode=cart_plus_current&productId=${productId}&quantity=${quantity}`,
    );
  };

  const handleBuyNow = () => {
    if (cartItemCount === 0) {
      goToCheckoutSingle();
      return;
    }

    setIsBuyChoiceOpen(true);
  };

  return (
    <div className="relative rounded-2xl border border-gray-200 p-5 shadow-sm">
      {toast.show && (
        <div
          className={`absolute right-0 top-0 z-20 w-full max-w-sm -translate-y-16 rounded-xl border px-4 py-3 shadow-lg ${
            toast.type === "success"
              ? "border-green-200 bg-white"
              : "border-red-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className={`text-sm font-medium ${
                toast.type === "success" ? "text-gray-900" : "text-red-500"
              }`}
            >
              {toast.message}
            </p>

            {toast.type === "success" && (
              <button
                type="button"
                onClick={() => router.push("/mypage/cart")}
                className="shrink-0 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
              >
                장바구니로 가기
              </button>
            )}
          </div>
        </div>
      )}

      {isBuyChoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">구매 방식 선택</h3>
            <p className="mt-2 text-sm text-gray-600">
              어떤 방식으로 결제창으로 이동할까요?
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={goToCheckoutSingle}
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                현재 상품만 구매
              </button>

              <button
                type="button"
                onClick={goToCheckoutWithCart}
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white"
              >
                장바구니 상품과 함께 구매
              </button>

              <button
                type="button"
                onClick={() => setIsBuyChoiceOpen(false)}
                className="w-full rounded-xl border px-4 py-3 text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">수량 선택</p>

          <div className="flex w-fit items-center overflow-hidden rounded-xl border border-gray-300">
            <button
              type="button"
              onClick={decrease}
              className="h-11 w-11 border-r border-gray-300 text-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSoldOut || isPending || quantity <= 1}
            >
              -
            </button>

            <input
              type="number"
              min={1}
              max={stock > 0 ? stock : 1}
              value={quantity}
              onChange={(e) => handleChangeQuantity(e.target.value)}
              disabled={isSoldOut || isPending}
              className="h-11 w-20 border-0 text-center text-base font-semibold outline-none"
            />

            <button
              type="button"
              onClick={increase}
              className="h-11 w-11 border-l border-gray-300 text-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSoldOut || isPending || quantity >= stock}
            >
              +
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>상품 금액</span>
            <span>{price.toLocaleString()}원</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <span>선택 수량</span>
            <span>{quantity}개</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-base font-semibold text-gray-900">
              총 금액
            </span>
            <span className="text-xl font-bold text-gray-900">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isSoldOut || isPending}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            {isPending ? "처리 중..." : "장바구니 담기"}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isSoldOut || isPending}
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            바로구매
          </button>
        </div>

        {isSoldOut && (
          <p className="text-sm font-medium text-red-500">품절된 상품입니다.</p>
        )}
      </div>
    </div>
  );
}
