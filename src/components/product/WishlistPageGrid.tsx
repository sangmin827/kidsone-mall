"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { toggleWishlistQuiet, type WishlistProduct } from "@/src/server/wishlist";

interface Props {
  initialItems: WishlistProduct[];
}

export default function WishlistPageGrid({ initialItems }: Props) {
  // 각 상품의 찜 여부를 클라이언트 상태로 관리 — 해제해도 카드는 그대로 유지
  const [wishlistMap, setWishlistMap] = useState<Record<number, boolean>>(
    Object.fromEntries(initialItems.map((item) => [item.id, true])),
  );
  const [, startTransition] = useTransition();

  const handleToggle = (productId: number) => {
    const current = wishlistMap[productId] ?? true;
    const next = !current;

    // 즉시 UI 반영
    setWishlistMap((prev) => ({ ...prev, [productId]: next }));

    startTransition(async () => {
      try {
        const result = await toggleWishlistQuiet(productId);
        setWishlistMap((prev) => ({ ...prev, [productId]: result.wishlisted }));
      } catch (err) {
        // 실패 시 롤백
        setWishlistMap((prev) => ({ ...prev, [productId]: current }));
        const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
        toast.error(msg);
      }
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {initialItems.map((item) => {
        const isWishlisted = wishlistMap[item.id] ?? true;
        const thumbnail =
          (item.product_images ?? []).find((img) => img.is_thumbnail) ??
          item.product_images?.[0];

        return (
          <div
            key={item.id}
            className={`group relative overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white transition-all hover:-translate-y-0.5 hover:shadow-md ${
              isWishlisted ? "" : "opacity-50"
            }`}
          >
            {/* 하트 버튼 — 아이콘만 표시 */}
            <button
              type="button"
              onClick={() => handleToggle(item.id)}
              aria-label={isWishlisted ? "찜 해제" : "다시 찜하기"}
              className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={isWishlisted ? "#FF5555" : "none"}
                stroke={isWishlisted ? "#FF5555" : "#9ca3af"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* 찜 해제 상태 안내 */}
            {!isWishlisted && (
              <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
                <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  찜 해제됨
                </span>
              </div>
            )}

            <Link href={`/products/${item.slug}`} className="block">
              <div className="relative aspect-square overflow-hidden bg-[#f5f4f1]">
                {thumbnail ? (
                  <Image
                    src={thumbnail.image_url}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl">
                    🧸
                  </div>
                )}
                {item.is_sold_out && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <span className="badge-sold-out">품절</span>
                  </div>
                )}
              </div>

              <div className="px-3 py-3">
                <p className="line-clamp-2 text-sm font-medium text-[#222222]">
                  {item.name}
                </p>
                <p className="mt-1.5 text-base font-bold text-[#222222]">
                  {item.price.toLocaleString()}
                  <span className="ml-0.5 text-xs font-normal text-[#6b7280]">
                    원
                  </span>
                </p>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
