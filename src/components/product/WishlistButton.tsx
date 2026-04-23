"use client";

import { useState, useTransition } from "react";
import { toggleWishlist } from "@/src/server/wishlist";

type Props = {
  productId: number;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
};

export default function WishlistButton({
  productId,
  initialWishlisted,
  isLoggedIn,
}: Props) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    const prev = wishlisted;
    setWishlisted(!prev); // 낙관적 업데이트

    startTransition(async () => {
      try {
        const result = await toggleWishlist(productId);
        setWishlisted(result.wishlisted);
      } catch {
        setWishlisted(prev); // 실패 시 롤백
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all
        ${wishlisted
          ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
          : "border-[#E8E6E1] bg-white text-[#6b7280] hover:border-red-200 hover:bg-red-50 hover:text-red-400"
        }
        ${isPending ? "opacity-60" : ""}
      `}
      aria-label={wishlisted ? "찜 해제" : "찜하기"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform"
        style={{ transform: wishlisted ? "scale(1.15)" : "scale(1)" }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {wishlisted ? "찜 완료" : "찜하기"}
    </button>
  );
}
