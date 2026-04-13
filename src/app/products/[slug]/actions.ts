'use server';

import { revalidatePath } from 'next/cache';
import { addToCart } from '@/src/server/cart';

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function addToCartAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const productId = Number(formData.get('productId'));
    const quantity = Number(formData.get('quantity'));

    if (!productId || !quantity || quantity < 1) {
      return { ok: false, message: '잘못된 요청입니다.' };
    }

    await addToCart(productId, quantity);

    revalidatePath('/mypage/cart');
    revalidatePath('/products');

    return {
      ok: true,
      message: '장바구니에 담았습니다.',
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '장바구니 담기에 실패했습니다.';
    return { ok: false, message };
  }
}
