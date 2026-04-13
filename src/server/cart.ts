import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getOrCreateProfile } from "@/src/server/profile";

type CartItemRow = {
  id: number;
  quantity: number;
  product_id: number;
  products: {
    id: number;
    name: string;
    slug: string;
    price: number;
    stock: number;
    short_description: string | null;
    product_images:
      | {
          image_url: string;
          is_thumbnail: boolean;
          sort_order: number;
        }[]
      | null;
  } | null;
};

export async function getMyCart() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { cart: null, items: [] };
  }
  await getOrCreateProfile(user);

  // 1) 내 cart 찾기
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id, user_id, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cartError) {
    throw new Error(`장바구니 조회 실패: ${cartError.message}`);
  }

  if (!cart) {
    const newCart = await getOrCreateCart(user.id);
    return { cart: newCart, items: [] };
  }

  // 2) cart_items + products + product_images 조회
  const { data: items, error: itemsError } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product_id,
      products (
        id,
        name,
        slug,
        price,
        stock,
        short_description,
        product_images (
          image_url,
          is_thumbnail,
          sort_order
        )
      )
    `,
    )
    .eq("cart_id", cart.id)
    .returns<CartItemRow[]>();

  if (itemsError) {
    throw new Error(`장바구니 상품 조회 실패: ${itemsError.message}`);
  }

  return {
    cart,
    items: items ?? [],
  };
}

export async function getOrCreateCart(userId: string) {
  const supabase = await createClient();

  const { data: existingCart, error: findError } = await supabase
    .from("carts")
    .select("id, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) {
    throw new Error(`장바구니 확인 실패: ${findError.message}`);
  }

  if (existingCart) {
    return existingCart;
  }

  const { data: newCart, error: insertError } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id, user_id")
    .single();

  if (insertError) {
    throw new Error(`장바구니 생성 실패: ${insertError.message}`);
  }

  return newCart;
}

export async function addToCart(productId: number, quantity: number = 1) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  if (quantity < 1) {
    throw new Error("수량은 1개 이상이어야 합니다.");
  }
  await getOrCreateProfile(user);

  // 상품 존재 및 재고 확인
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, stock, is_active")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    throw new Error("상품을 찾을 수 없습니다.");
  }

  if (!product.is_active) {
    throw new Error("판매 중인 상품이 아닙니다.");
  }

  if (product.stock < quantity) {
    throw new Error("재고가 부족합니다.");
  }

  const cart = await getOrCreateCart(user.id);

  // 이미 담긴 상품인지 확인
  const { data: existingItem, error: existingError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`장바구니 상품 확인 실패: ${existingError.message}`);
  }

  if (existingItem) {
    const nextQuantity = existingItem.quantity + quantity;

    if (product.stock < nextQuantity) {
      throw new Error("재고보다 많이 담을 수 없습니다.");
    }

    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
      .eq("id", existingItem.id);

    if (updateError) {
      throw new Error(`장바구니 수량 업데이트 실패: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: productId,
      quantity,
    });

    if (insertError) {
      throw new Error(`장바구니 추가 실패: ${insertError.message}`);
    }
  }

  revalidatePath("/cart");
}

type CartItemWithProductStock = {
  id: number;
  quantity: number;
  product_id: number;
  products:
    | {
        stock: number;
      }
    | {
        stock: number;
      }[]
    | null;
};

export async function updateCartItemQuantity(
  cartItemId: number,
  quantity: number,
) {
  const supabase = await createClient();

  if (quantity < 1) {
    throw new Error("수량은 1개 이상이어야 합니다.");
  }

  // cart_item + product 재고 확인
  const { data, error: itemError } = await supabase
    .from("cart_items")
    .select(
      `
    id,
    quantity,
    product_id,
    products!inner (
      stock
    )
  `,
    )
    .eq("id", cartItemId)
    .single();

  const item = data as CartItemWithProductStock | null;

  if (itemError || !item) {
    throw new Error("장바구니 상품을 찾을 수 없습니다.");
  }

  const product = Array.isArray(item.products)
    ? item.products[0]
    : item.products;

  const stock = product?.stock ?? 0;

  if (quantity > stock) {
    throw new Error("재고보다 많이 담을 수 없습니다.");
  }

  if (stock == null) {
    throw new Error("상품 재고 정보를 찾을 수 없습니다.");
  }

  const { error: updateError } = await supabase
    .from("cart_items")
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cartItemId);

  if (updateError) {
    throw new Error(`수량 변경 실패: ${updateError.message}`);
  }

  revalidatePath("/cart");
}

export async function removeCartItem(cartItemId: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) {
    throw new Error(`장바구니 삭제 실패: ${error.message}`);
  }

  revalidatePath("/cart");
}
