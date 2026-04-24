//src/components/product/ProductPurchaseBox.tsx

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/src/app/products/[slug]/actions";
import { usePathname, useSearchParams } from "next/navigation";
import SocialLoginButtons from "@/src/app/login/social-login-buttons";
import type { PublicOptionGroup } from "@/src/server/product-options";

type Props = {
  productId: number;
  price: number;
  stock: number;
  cartItemCount: number;
  isLoggedIn: boolean;
  shippingFee?: number;
  shippingFeeText?: string | null;
  optionGroups?: PublicOptionGroup[];
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
  isLoggedIn,
  shippingFee = 0,
  shippingFeeText,
  optionGroups = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isBuyChoiceOpen, setIsBuyChoiceOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

  // option selections: groupId -> selected valueId
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>(() => {
    const init: Record<number, number | null> = {};
    for (const g of optionGroups) init[g.id] = null;
    return init;
  });

  // Calculate total price delta from selected options
  const optionPriceDelta = optionGroups.reduce((sum, group) => {
    const selId = selectedOptions[group.id];
    if (selId == null) return sum;
    const val = group.option_values.find((v) => v.id === selId);
    return sum + (val?.price_delta ?? 0);
  }, 0);

  const hasOptions = optionGroups.some((g) => g.option_values.length > 0);

  // checkout / cart 페이지를 미리 prefetch 해서 클릭시 즉시 이동 가능하게 처리
  useEffect(() => {
    router.prefetch("/mypage/cart");
    router.prefetch(
      `/checkout?mode=single&productId=${productId}&quantity=1`,
    );
    router.prefetch(
      `/checkout?mode=cart_plus_current&productId=${productId}&quantity=1`,
    );
    router.prefetch("/checkout?mode=cart");
  }, [router, productId]);

  const getInitialQuantity = () => {
    const qty = Number(searchParams.get("buyQty") ?? "1");
    if (Number.isNaN(qty)) return 1;
    if (qty < 1) return 1;
    if (stock > 0 && qty > stock) return stock;
    return qty;
  };
  const [quantity, setQuantity] = useState(getInitialQuantity);
  const isSoldOut = stock <= 0;
  const unitPrice = price + optionPriceDelta;
  const totalPrice = unitPrice * quantity;

  const normalizeQuantity = (value: number) => {
    if (Number.isNaN(value)) return 1;
    if (value < 1) return 1;
    if (stock > 0 && value > stock) return stock;
    return value;
  };

  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);
    return () => clearTimeout(timer);
  }, [toast.show]);

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

  const getReturnPathWithQuantity = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("buyQty", String(quantity));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const openToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const handleAddToCart = () => {
    openToast("장바구니에 담았습니다.", "success");
    const formData = new FormData();
    formData.set("productId", String(productId));
    formData.set("quantity", String(quantity));
    startTransition(async () => {
      const result = await addToCartAction(formData);
      if (!result.ok) {
        openToast(result.message, "error");
      } else {
        router.refresh();
      }
    });
  };

  const goToCheckoutSingle = () => {
    setIsBuyChoiceOpen(false);
    router.push(
      `/checkout?mode=single&productId=${productId}&quantity=${quantity}`,
    );
  };

  const goToGuestCheckout = () => {
    setIsLoginPromptOpen(false);
    router.push(
      `/checkout?mode=single&productId=${productId}&quantity=${quantity}`,
    );
  };

  const goToCheckoutWithCart = () => {
    setIsBuyChoiceOpen(false);
    router.push(
      `/checkout?mode=cart_plus_current&productId=${productId}&quantity=${quantity}`,
    );
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true);
      return;
    }
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

      {isLoginPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              로그인 후 구매하시겠습니까?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              로그인을 하시면 주문조회가 더 쉽습니다. 로그인하시고 구매하시겠습니까?
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-xl border p-3">
                <SocialLoginButtons redirectPath={getReturnPathWithQuantity()} />
              </div>
              <button
                type="button"
                onClick={goToGuestCheckout}
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                비회원으로 구매
              </button>
              <button
                type="button"
                onClick={() => setIsLoginPromptOpen(false)}
                className="w-full rounded-xl border px-4 py-3 text-sm"
              >
                취소
              </button>
            </div>
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
        {/* 배송비 */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 text-sm">
          <span className="text-gray-600">배송비</span>
          <span className="font-medium text-gray-900">
            {shippingFee === 0
              ? "무료배송"
              : `${shippingFee.toLocaleString()}원`}
            {shippingFeeText && (
              <span className="ml-1.5 text-xs text-gray-400">({shippingFeeText})</span>
            )}
          </span>
        </div>

        {/* 옵션 선택 */}
        {hasOptions && optionGroups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 text-sm font-medium text-gray-700">{group.name} 선택</p>
            <div className="flex flex-wrap gap-2">
              {group.option_values.map((ov) => {
                const isSelected = selectedOptions[group.id] === ov.id;
                const soldOut = ov.is_sold_out;
                return (
                  <button
                    key={ov.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        [group.id]: isSelected ? null : ov.id,
                      }))
                    }
                    className={`rounded-xl border px-3 py-2 text-sm transition-all ${
                      soldOut
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                        : isSelected
                        ? "border-gray-900 bg-gray-900 font-semibold text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                    }`}
                  >
                    {ov.value}
                    {ov.price_delta !== 0 && (
                      <span className="ml-1 text-xs opacity-75">
                        ({ov.price_delta > 0 ? "+" : ""}
                        {ov.price_delta.toLocaleString()}원)
                      </span>
                    )}
                    {soldOut && <span className="ml-1 text-[10px]">품절</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* 수량 선택 */}
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

        {/* 금액 요약 */}
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>상품 금액</span>
            <span>{price.toLocaleString()}원</span>
          </div>
          {optionPriceDelta !== 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>옵션 추가금액</span>
              <span>{optionPriceDelta > 0 ? "+" : ""}{optionPriceDelta.toLocaleString()}원</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>선택 수량</span>
            <span>{quantity}개</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-base font-semibold text-gray-900">총 금액</span>
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
