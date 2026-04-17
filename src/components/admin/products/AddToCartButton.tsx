"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/src/lib/supabase/client";

type Props = {
  productId: number;
  quantity: number;
};

export default function AddToCartButton({ productId, quantity }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [pending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  const handleAddToCart = () => {
    if (pending || clicked) return;

    setClicked(true);

    startTransition(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("로그인이 필요합니다.");
          const params = new URLSearchParams(searchParams.toString());
          params.set("login", "1");
          router.push(`${pathname}?${params.toString()}`);
          setClicked(false);
          return;
        }

        const { data: cart, error: cartError } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cartError) throw cartError;

        let cartId = cart?.id;

        if (!cartId) {
          const { data: newCart, error: newCartError } = await supabase
            .from("carts")
            .insert({ user_id: user.id })
            .select("id")
            .single();

          if (newCartError) throw newCartError;
          cartId = newCart.id;
        }

        const { data: existingItem, error: existingItemError } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", productId)
          .maybeSingle();

        if (existingItemError) throw existingItemError;

        if (existingItem) {
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({
              quantity: existingItem.quantity + quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("cart_items")
            .insert({
              cart_id: cartId,
              product_id: productId,
              quantity,
            });

          if (insertError) throw insertError;
        }

        toast.success("장바구니에 담았습니다.");
        router.push("/mypage/cart");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "장바구니 처리 중 오류가 발생했습니다.";
        toast.error(message);
        setClicked(false);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={pending || clicked}
      className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60"
    >
      {pending ? "처리 중..." : "장바구니"}
    </button>
  );
}
