// server/orders.ts
import { createClient } from "@/src/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getOrCreateProfile } from "@/src/server/profile";

export type MyOrderItem = {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
};

export type MyOrder = {
  id: number;
  order_number: string;
  status:
    | "pending"
    | "paid"
    | "preparing"
    | "shipping"
    | "delivered"
    | "cancelled";
  total_amount: number;
  orderer_name: string | null;
  orderer_phone: string | null;
  recipient_name: string;
  recipient_phone: string;
  zip_code: string | null;
  address: string;
  detail_address: string | null;
  request_message: string | null;
  created_at: string;
  order_items: MyOrderItem[];
};

export async function getMyOrders(): Promise<MyOrder[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      total_amount,
      orderer_name,
      orderer_phone,
      recipient_name,
      recipient_phone,
      zip_code,
      address,
      detail_address,
      request_message,
      created_at,
      order_items (
        id,
        product_id,
        product_name_snapshot,
        price_snapshot,
        quantity
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`주문내역 조회 실패: ${error.message}`);
  }

  return (data ?? []) as MyOrder[];
}

type CheckoutInput = {
  recipient_name: string;
  recipient_phone: string;
  zip_code?: string;
  address: string;
  detail_address?: string;
  request_message?: string;
  depositor_name?: string;
};

function makeOrderNumber() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `ORD-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${random}`;
}

export async function createOrderFromCart(input: CheckoutInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  await getOrCreateProfile(user);

  // 1) 프로필 조회: 주문자 이름/연락처 스냅샷용
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, phone")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("회원 정보를 불러오지 못했습니다.");
  }

  // 2) 장바구니 조회
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cartError) {
    throw new Error(`장바구니 조회 실패: ${cartError.message}`);
  }

  if (!cart) {
    throw new Error("장바구니가 비어 있습니다.");
  }

  // 3) 장바구니 상품 조회
  const { data: cartItems, error: cartItemsError } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product_id,
      products (
        id,
        name,
        price,
        stock,
        is_active
      )
    `,
    )
    .eq("cart_id", cart.id);

  if (cartItemsError) {
    throw new Error(`장바구니 상품 조회 실패: ${cartItemsError.message}`);
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error("주문할 상품이 없습니다.");
  }

  // 4) 재고/판매상태 확인 + 총액 계산
  let totalAmount = 0;

  for (const item of cartItems) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;

    if (!product) {
      throw new Error("상품 정보를 찾을 수 없습니다.");
    }

    if (!product.is_active) {
      throw new Error(`판매 중지된 상품이 포함되어 있습니다: ${product.name}`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`재고가 부족합니다: ${product.name}`);
    }

    totalAmount += product.price * item.quantity;
  }

  const orderNumber = makeOrderNumber();

  // 5) orders 생성
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: "pending",
      payment_method: "bank_transfer",
      total_amount: totalAmount,
      orderer_name: profile.name ?? null,
      orderer_phone: profile.phone ?? null,
      depositor_name: input.depositor_name?.trim() || null,
      recipient_name: input.recipient_name.trim(),
      recipient_phone: input.recipient_phone.trim(),
      zip_code: input.zip_code?.trim() || null,
      address: input.address.trim(),
      detail_address: input.detail_address?.trim() || null,
      request_message: input.request_message?.trim() || null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    throw new Error(
      `주문 생성 실패: ${orderError?.message ?? "알 수 없는 오류"}`,
    );
  }

  // 6) order_items 생성
  const orderItemsPayload = cartItems.map((item) => {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;

    if (!product) {
      throw new Error("상품 정보를 찾을 수 없습니다.");
    }

    return {
      order_id: order.id,
      product_id: item.product_id,
      product_name_snapshot: product.name,
      price_snapshot: product.price,
      quantity: item.quantity,
    };
  });

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (orderItemsError) {
    throw new Error(`주문 상품 생성 실패: ${orderItemsError.message}`);
  }

  // 7) 재고 차감
  for (const item of cartItems) {
    const product = Array.isArray(item.products)
      ? item.products[0]
      : item.products;

    if (!product) continue;

    const nextStock = product.stock - item.quantity;

    const { error: stockError } = await supabase
      .from("products")
      .update({
        stock: nextStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (stockError) {
      throw new Error(`재고 차감 실패: ${stockError.message}`);
    }
  }

  // 8) 장바구니 비우기
  const { error: deleteCartItemsError } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (deleteCartItemsError) {
    throw new Error(`장바구니 비우기 실패: ${deleteCartItemsError.message}`);
  }

  revalidatePath("/cart");
  revalidatePath("/mypage");
  revalidatePath("/mypage/orders");

  return order;
}
