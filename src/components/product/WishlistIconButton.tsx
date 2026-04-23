"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleWishlist } from "@/src/server/wishlist";

interface WishlistIconButtonProps {
  productId: number;
  initialWishlisted: boolean;
  className?: string;
}

export default function WishlistIconButton({
  productId,
  initialWishlisted,
  className = "",
}: WishlistIconButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPopping, setIsPopping] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;

    const next = !wishlisted;
    setWishlisted(next);

    if (next) {
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 500);
    }

    startTransition(async () => {
      try {
        await toggleWishlist(productId);
      } catch (err) {
        // 실패 시 롤백
        setWishlisted(!next);
        const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
        if (msg.includes("로그인")) {
          toast.error("로그인 후 찜하기를 이용할 수 있어요.");
        } else {
          toast.error(msg);
        }
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={wishlisted ? "찜 해제" : "찜하기"}
      disabled={isPending}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-90 disabled:opacity-60 ${className}`}
    >
      <span className={isPopping ? "heart-pop" : "inline-flex"}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={wishlisted ? "#FF5555" : "none"}
          stroke={wishlisted ? "#FF5555" : "#9ca3af"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </span>
    </button>
  );
}
