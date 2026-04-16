import { createClient } from "@/src/lib/supabase/server";
import { getMyCart } from "@/src/server/cart";

export type CheckoutItem = {
  product_id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  quantity: number;
  image_url: string | null;
  from_cart?: boolean;
  cart_item_id?: number | null;
};

export type SavedAddress = {
  id: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_extra: string | null;
  zip_code: string;
  address: string;
  detail_address: string | null;
  is_default: boolean;
};

export type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
};

async function getProductForCheckout(
  productId: number,
  quantity: number,
): Promise<CheckoutItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      slug,
      price,
      stock,
      is_active,
      product_images (
        image_url,
        is_thumbnail,
        sort_order
      )
      `,
    )
    .eq("id", productId)
    .single();

  if (error || !data || !data.is_active) {
    return null;
  }

  const thumbnail =
    data.product_images?.find((img) => img.is_thumbnail)?.image_url ??
    data.product_images?.[0]?.image_url ??
    null;

  return {
    product_id: data.id,
    name: data.name,
    slug: data.slug,
    price: data.price,
    stock: data.stock ?? 0,
    quantity,
    image_url: thumbnail,
    from_cart: false,
    cart_item_id: null,
  };
}

function mergeCheckoutItems(
  cartItems: CheckoutItem[],
  currentItem: CheckoutItem,
): CheckoutItem[] {
  const existing = cartItems.find(
    (item) => item.product_id === currentItem.product_id,
  );

  if (!existing) {
    return [...cartItems, currentItem];
  }

  return cartItems.map((item) =>
    item.product_id === currentItem.product_id
      ? {
          ...item,
          quantity: Math.min(item.stock, item.quantity + currentItem.quantity),
        }
      : item,
  );
}

export async function getCheckoutItems(params: {
  mode?: string;
  productId?: number;
  quantity?: number;
}): Promise<CheckoutItem[]> {
  const { mode, productId, quantity } = params;

  if (mode === "single") {
    if (!productId || !quantity) return [];
    const item = await getProductForCheckout(productId, quantity);
    return item ? [item] : [];
  }

  if (mode === "cart_plus_current") {
    const { items } = await getMyCart();

    const cartItems: CheckoutItem[] = items
      .filter((item) => item.products)
      .map((item) => {
        const product = item.products!;
        const thumbnail =
          product.product_images?.find((img) => img.is_thumbnail)?.image_url ??
          product.product_images?.[0]?.image_url ??
          null;

        return {
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          stock: product.stock ?? 0,
          quantity: item.quantity,
          image_url: thumbnail,
          from_cart: true,
          cart_item_id: item.id,
        };
      });

    if (!productId || !quantity) {
      return cartItems;
    }

    const currentItem = await getProductForCheckout(productId, quantity);

    if (!currentItem) {
      return cartItems;
    }

    return mergeCheckoutItems(cartItems, currentItem);
  }

  const { items } = await getMyCart();

  return items
    .filter((item) => item.products)
    .map((item) => {
      const product = item.products!;
      const thumbnail =
        product.product_images?.find((img) => img.is_thumbnail)?.image_url ??
        product.product_images?.[0]?.image_url ??
        null;

      return {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        stock: product.stock ?? 0,
        quantity: item.quantity,
        image_url: thumbnail,
        from_cart: true,
        cart_item_id: item.id,
      };
    });
}

export async function getMyAddresses(): Promise<SavedAddress[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("shipping_addresses")
    .select(
      `
      id,
      recipient_name,
      recipient_phone,
      recipient_phone_extra,
      postal_code,
      address_main,
      address_detail,
      is_default
      `,
    )
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("id", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    id: item.id,
    recipient_name: item.recipient_name,
    recipient_phone: item.recipient_phone,
    recipient_phone_extra: item.recipient_phone_extra ?? null,
    zip_code: item.postal_code ?? "",
    address: item.address_main,
    detail_address: item.address_detail,
    is_default: item.is_default,
  }));
}

export async function getActiveBankAccounts(): Promise<BankAccount[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("id, bank_name, account_number, account_holder")
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as BankAccount[];
}
