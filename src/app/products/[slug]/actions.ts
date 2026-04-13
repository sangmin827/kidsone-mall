"use server";

import { addToCart } from "@/src/server/cart";
import { redirect } from "next/navigation";

export async function addToCartAction(formData: FormData) {
  const productId = Number(formData.get("productId"));

  if (!productId) {
    throw new Error("상품 ID가 없습니다.");
  }

  await addToCart(productId, 1);

  redirect("/mypage/cart");
}
