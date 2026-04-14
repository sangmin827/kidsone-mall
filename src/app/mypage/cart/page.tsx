// src/app/mypage/cart/page.tsx
import { getMyCart } from "@/src/server/cart";
import CartClient from "@/src/components/cart/CartClient";

export default async function CartPage() {
  const { items } = await getMyCart();

  return <CartClient initialItems={items} />;
}
