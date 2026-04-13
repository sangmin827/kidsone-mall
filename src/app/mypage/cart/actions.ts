'use server';

import { revalidatePath } from 'next/cache';
import { removeCartItem, updateCartItemQuantity } from '@/src/server/cart';

type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export async function increaseCartItemAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const cartItemId = Number(formData.get('cartItemId'));
    const currentQuantity = Number(formData.get('currentQuantity'));

    if (!cartItemId || !currentQuantity) {
      return { ok: false, message: '잘못된 요청입니다.' };
    }

    await updateCartItemQuantity(cartItemId, currentQuantity + 1);
    revalidatePath('/cart');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '수량 증가에 실패했습니다.';
    return { ok: false, message };
  }
}

export async function decreaseCartItemAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const cartItemId = Number(formData.get('cartItemId'));
    const currentQuantity = Number(formData.get('currentQuantity'));

    if (!cartItemId || !currentQuantity) {
      return { ok: false, message: '잘못된 요청입니다.' };
    }

    if (currentQuantity <= 1) {
      await removeCartItem(cartItemId);
    } else {
      await updateCartItemQuantity(cartItemId, currentQuantity - 1);
    }

    revalidatePath('/cart');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '수량 감소에 실패했습니다.';
    return { ok: false, message };
  }
}

export async function setCartItemQuantityAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const cartItemId = Number(formData.get('cartItemId'));
    const quantity = Number(formData.get('quantity'));

    if (!cartItemId || !quantity || quantity < 1) {
      return { ok: false, message: '잘못된 요청입니다.' };
    }

    await updateCartItemQuantity(cartItemId, quantity);
    revalidatePath('/cart');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '수량 변경에 실패했습니다.';
    return { ok: false, message };
  }
}

export async function removeCartItemAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const cartItemId = Number(formData.get('cartItemId'));

    if (!cartItemId) {
      return { ok: false, message: '잘못된 요청입니다.' };
    }

    await removeCartItem(cartItemId);
    revalidatePath('/cart');
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '삭제에 실패했습니다.';
    return { ok: false, message };
  }
}
