"use server";

import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── 찜 토글 ───────────────────────────────────────────────────────────────
export async function toggleWishlist(
  productId: number,
): Promise<{ wishlisted: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    revalidatePath("/mypage/wishlist");
    return { wishlisted: false };
  } else {
    await supabase
      .from("wishlists")
      .insert({ user_id: user.id, product_id: productId });
    revalidatePath("/mypage/wishlist");
    return { wishlisted: true };
  }
}

// ── 찜 토글 (페이지 새로고침 없음 — 위시리스트 페이지 전용) ─────────────
export async function toggleWishlistQuiet(
  productId: number,
): Promise<{ wishlisted: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const { data: existing } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single();

  if (existing) {
    await supabase.from("wishlists").delete().eq("id", existing.id);
    return { wishlisted: false };
  } else {
    await supabase
      .from("wishlists")
      .insert({ user_id: user.id, product_id: productId });
    return { wishlisted: true };
  }
}

// ── 찜 목록 상품 타입 ────────────────────────────────────────────────────
export type WishlistProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  is_sold_out: boolean | null;
  product_images: { image_url: string; is_thumbnail: boolean | null }[] | null;
  wishlisted_at: string;
};

// ── 내 찜 목록 조회 ──────────────────────────────────────────────────────
export async function getMyWishlists(): Promise<WishlistProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wishlists")
    .select(
      `
      created_at,
      products (
        id, name, slug, price, is_sold_out,
        product_images (image_url, is_thumbnail, sort_order, image_type)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((w) => w.products)
    .map((w) => {
      const product = Array.isArray(w.products) ? w.products[0] : w.products;
      return {
        ...(product as Omit<WishlistProduct, "wishlisted_at">),
        product_images: (
          (product.product_images as {
            image_url: string;
            is_thumbnail: boolean | null;
            image_type: string;
          }[]) ?? []
        ).filter((img) => img.image_type === "gallery"),
        wishlisted_at: w.created_at,
      };
    }) as WishlistProduct[];
}

// ── 현재 유저의 찜한 상품 ID 전체 집합 (목록 페이지 초기값용) ───────────
export async function getWishlistProductIds(): Promise<Set<number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id);

  if (!data) return new Set();
  return new Set(data.map((w) => w.product_id as number));
}

// ── 현재 유저의 찜한 상품 ID 집합 (상세 페이지에서 초기값 확인용) ───────
export async function getWishlistStatus(productId: number): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single();

  return !!data;
}
