// src/server/orders.ts
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
  orderer_email: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_extra: string | null;
  zip_code: string | null;
  address: string;
  detail_address: string | null;
  request_message: string | null;
  created_at: string;
  order_items: MyOrderItem[];
};

export type GuestLookupOrder = {
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
  orderer_email: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_extra: string | null;
  zip_code: string | null;
  address: string;
  detail_address: string | null;
  request_message: string | null;
  created_at: string;
  order_items: MyOrderItem[];
};

type CheckoutInputItem = {
  product_id: number;
  quantity: number;
};

type CheckoutInput = {
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_extra?: string;
  zip_code?: string;
  address: string;
  detail_address?: string;
  request_message?: string;
  depositor_name?: string;
  orderer_name?: string;
  orderer_phone?: string;
  orderer_email?: string;
  items?: CheckoutInputItem[];
};

type ProductForOrder = {
  id: number;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
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

function validatePhone(phone: string, fieldName: string) {
  const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;

  if (!phoneRegex.test(phone)) {
    throw new Error(`${fieldName}는 010-1234-5678 형식으로 입력해주세요.`);
  }
}

function normalizeCommonOrderInput(input: CheckoutInput) {
  const recipient_name = input.recipient_name?.trim() ?? "";
  const recipient_phone = input.recipient_phone?.trim() ?? "";
  const recipient_phone_extra = input.recipient_phone_extra?.trim() || null;
  const zip_code = input.zip_code?.trim() || null;
  const address = input.address?.trim() ?? "";
  const detail_address = input.detail_address?.trim() || null;
  const request_message = input.request_message?.trim() || null;
  const depositor_name = input.depositor_name?.trim() || null;

  if (!recipient_name || !recipient_phone || !address) {
    throw new Error("수령자 이름, 연락처 1, 주소는 필수입니다.");
  }

  validatePhone(recipient_phone, "수령자 연락처 1");

  if (recipient_phone_extra) {
    validatePhone(recipient_phone_extra, "수령자 연락처 2");
  }

  return {
    recipient_name,
    recipient_phone,
    recipient_phone_extra,
    zip_code,
    address,
    detail_address,
    request_message,
    depositor_name,
  };
}

async function reduceProductStock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: { productId: number; quantity: number; currentStock: number }[],
) {
  for (const item of items) {
    const nextStock = item.currentStock - item.quantity;

    const { error } = await supabase
      .from("products")
      .update({
        stock: nextStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.productId);

    if (error) {
      throw new Error(`재고 차감 실패: ${error.message}`);
    }
  }
}

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
      orderer_email,
      recipient_name,
      recipient_phone,
      recipient_phone_extra,
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

async function createMemberOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: CheckoutInput,
) {
  const normalized = normalizeCommonOrderInput(input);

  const {
    data: { user },
    error: authUserError,
  } = await supabase.auth.getUser();

  if (authUserError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  await getOrCreateProfile(user);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, phone, email")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("회원 정보를 불러오지 못했습니다.");
  }

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (cartError) {
    throw new Error(`장바구니 조회 실패: ${cartError.message}`);
  }

  if (!cart) {
    throw new Error("장바구니가 비어 있습니다.");
  }

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

  let totalAmount = 0;

  const stockPayload: {
    productId: number;
    quantity: number;
    currentStock: number;
  }[] = [];

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

    stockPayload.push({
      productId: product.id,
      quantity: item.quantity,
      currentStock: product.stock,
    });
  }

  const orderNumber = makeOrderNumber();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      is_guest: false,
      order_number: orderNumber,
      status: "pending",
      payment_method: "bank_transfer",
      total_amount: totalAmount,
      orderer_name: profile.name ?? null,
      orderer_phone: profile.phone ?? null,
      orderer_email: profile.email ?? null,
      depositor_name: normalized.depositor_name,
      recipient_name: normalized.recipient_name,
      recipient_phone: normalized.recipient_phone,
      recipient_phone_extra: normalized.recipient_phone_extra,
      zip_code: normalized.zip_code,
      address: normalized.address,
      detail_address: normalized.detail_address,
      request_message: normalized.request_message,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    throw new Error(
      `주문 생성 실패: ${orderError?.message ?? "알 수 없는 오류"}`,
    );
  }

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

  await reduceProductStock(supabase, stockPayload);

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

async function createGuestOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: CheckoutInput,
) {
  const normalized = normalizeCommonOrderInput(input);

  const orderer_name = input.orderer_name?.trim() ?? "";
  const orderer_phone = input.orderer_phone?.trim() ?? "";
  const orderer_email = input.orderer_email?.trim() ?? "";
  const items = input.items ?? [];

  if (!orderer_name || !orderer_phone || !orderer_email) {
    throw new Error(
      "비회원 주문자는 이름, 연락처, 이메일을 모두 입력해주세요.",
    );
  }

  validatePhone(orderer_phone, "주문자 연락처");

  if (items.length === 0) {
    throw new Error("주문할 상품이 없습니다.");
  }

  const normalizedItems = items.map((item) => ({
    product_id: Number(item.product_id),
    quantity: Number(item.quantity),
  }));

  for (const item of normalizedItems) {
    if (!item.product_id || !item.quantity || item.quantity < 1) {
      throw new Error("잘못된 주문 상품 정보입니다.");
    }
  }

  const productIds = normalizedItems.map((item) => item.product_id);

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, stock, is_active")
    .in("id", productIds);

  if (productsError) {
    throw new Error(`상품 조회 실패: ${productsError.message}`);
  }

  if (!products || products.length === 0) {
    throw new Error("주문 가능한 상품을 찾을 수 없습니다.");
  }

  const productMap = new Map<number, ProductForOrder>();
  for (const product of products) {
    productMap.set(product.id, product as ProductForOrder);
  }

  let totalAmount = 0;

  const stockPayload: {
    productId: number;
    quantity: number;
    currentStock: number;
  }[] = [];
  const orderItemsPayload: {
    product_id: number;
    product_name_snapshot: string;
    price_snapshot: number;
    quantity: number;
  }[] = [];

  for (const item of normalizedItems) {
    const product = productMap.get(item.product_id);

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

    stockPayload.push({
      productId: product.id,
      quantity: item.quantity,
      currentStock: product.stock,
    });

    orderItemsPayload.push({
      product_id: product.id,
      product_name_snapshot: product.name,
      price_snapshot: product.price,
      quantity: item.quantity,
    });
  }

  const orderNumber = makeOrderNumber();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: null,
      is_guest: true,
      order_number: orderNumber,
      status: "pending",
      payment_method: "bank_transfer",
      total_amount: totalAmount,
      orderer_name,
      orderer_phone,
      orderer_email,
      depositor_name: normalized.depositor_name,
      recipient_name: normalized.recipient_name,
      recipient_phone: normalized.recipient_phone,
      recipient_phone_extra: normalized.recipient_phone_extra,
      zip_code: normalized.zip_code,
      address: normalized.address,
      detail_address: normalized.detail_address,
      request_message: normalized.request_message,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    throw new Error(
      `비회원 주문 생성 실패: ${orderError?.message ?? "알 수 없는 오류"}`,
    );
  }

  const finalOrderItemsPayload = orderItemsPayload.map((item) => ({
    order_id: order.id,
    ...item,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(finalOrderItemsPayload);

  if (orderItemsError) {
    throw new Error(`비회원 주문 상품 생성 실패: ${orderItemsError.message}`);
  }

  await reduceProductStock(supabase, stockPayload);

  revalidatePath("/products");

  return order;
}

export async function createOrder(input: CheckoutInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return createMemberOrder(supabase, user.id, input);
  }

  return createGuestOrder(supabase, input);
}

// 기존 코드와 호환용으로 남겨둘 수 있음
export async function createOrderFromCart(input: CheckoutInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return createMemberOrder(supabase, user.id, input);
}

export async function getGuestOrderByOrderNumberAndPhone(
  orderNumber: string,
  ordererPhone: string,
): Promise<GuestLookupOrder | null> {
  const supabase = await createClient();

  const normalizedOrderNumber = orderNumber.trim();
  const normalizedPhone = ordererPhone.trim();

  if (!normalizedOrderNumber || !normalizedPhone) {
    throw new Error("주문번호와 연락처를 입력해주세요.");
  }

  validatePhone(normalizedPhone, "주문자 연락처");

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
      orderer_email,
      recipient_name,
      recipient_phone,
      recipient_phone_extra,
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
    .eq("order_number", normalizedOrderNumber)
    .eq("orderer_phone", normalizedPhone)
    .eq("is_guest", true)
    .maybeSingle();

  if (error) {
    throw new Error(`비회원 주문 조회 실패: ${error.message}`);
  }

  return (data ?? null) as GuestLookupOrder | null;
}

export type AdminOrderItem = {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  price_snapshot: number;
  quantity: number;
};

export type AdminOrder = {
  id: number;
  user_id: string | null;
  order_number: string;
  status:
    | "pending"
    | "paid"
    | "preparing"
    | "shipping"
    | "delivered"
    | "cancelled";
  payment_method: string;
  total_amount: number;
  depositor_name: string | null;
  orderer_name: string | null;
  orderer_phone: string | null;
  orderer_email: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_extra: string | null;
  zip_code: string | null;
  address: string;
  detail_address: string | null;
  request_message: string | null;
  is_guest: boolean;
  created_at: string;
  order_items: AdminOrderItem[];
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("프로필 정보를 확인할 수 없습니다.");
  }

  if (profile.role !== "admin") {
    throw new Error("관리자만 접근할 수 있습니다.");
  }

  return { supabase, user };
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      order_number,
      status,
      payment_method,
      total_amount,
      depositor_name,
      orderer_name,
      orderer_phone,
      orderer_email,
      recipient_name,
      recipient_phone,
      recipient_phone_extra,
      zip_code,
      address,
      detail_address,
      request_message,
      is_guest,
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
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`관리자 주문 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminOrder[];
}

const ORDER_STATUS_VALUES = [
  "pending",
  "paid",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
] as const;

export async function updateOrderStatus(formData: FormData) {
  "use server";

  const { supabase } = await requireAdmin();

  const orderId = Number(formData.get("orderId"));
  const status = String(formData.get("status") ?? "");

  if (!orderId || !ORDER_STATUS_VALUES.includes(status as never)) {
    throw new Error("잘못된 요청입니다.");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(`주문 상태 변경 실패: ${error.message}`);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/mypage/orders");
}

export async function getAdminOrderById(
  orderId: number,
): Promise<AdminOrder | null> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      user_id,
      order_number,
      status,
      payment_method,
      total_amount,
      depositor_name,
      orderer_name,
      orderer_phone,
      orderer_email,
      recipient_name,
      recipient_phone,
      recipient_phone_extra,
      zip_code,
      address,
      detail_address,
      request_message,
      is_guest,
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
    .eq("id", orderId)
    .single();

  if (error) {
    throw new Error(`관리자 주문 상세 조회 실패: ${error.message}`);
  }

  return (data ?? null) as AdminOrder | null;
}
