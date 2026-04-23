'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/server/admin-auth';

export type ProductOptionGroup = {
  id: number;
  product_id: number;
  name: string;        // e.g. "색상", "사이즈"
  sort_order: number;
  option_values: ProductOptionValue[];
};

export type ProductOptionValue = {
  id: number;
  group_id: number;
  value: string;       // e.g. "레드", "L"
  price_delta: number; // 0 = 기본 가격
  stock: number;
  is_sold_out: boolean;
  sort_order: number;
};

// ──────────────────────────────────────────────────────────────
//  READ
// ──────────────────────────────────────────────────────────────

export async function getProductOptionGroups(
  productId: number,
): Promise<ProductOptionGroup[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: groups, error } = await supabase
    .from('product_option_groups')
    .select('id, product_id, name, sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`옵션 그룹 조회 실패: ${error.message}`);

  const groupIds = (groups ?? []).map((g) => g.id);

  if (groupIds.length === 0) return [];

  const { data: values, error: vError } = await supabase
    .from('product_option_values')
    .select('id, group_id, value, price_delta, stock, is_sold_out, sort_order')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true });

  if (vError) throw new Error(`옵션 값 조회 실패: ${vError.message}`);

  return (groups ?? []).map((g) => ({
    ...g,
    option_values: (values ?? []).filter((v) => v.group_id === g.id),
  })) as ProductOptionGroup[];
}

// ──────────────────────────────────────────────────────────────
//  OPTION GROUP CRUD
// ──────────────────────────────────────────────────────────────

export async function createOptionGroup(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const productId = Number(formData.get('product_id'));
  const name = String(formData.get('name') ?? '').trim();
  const sortOrder = Number(formData.get('sort_order') ?? 0);

  if (!productId || !name) throw new Error('필수 값이 누락되었습니다.');

  const { error } = await supabase
    .from('product_option_groups')
    .insert({ product_id: productId, name, sort_order: sortOrder });

  if (error) throw new Error(`옵션 그룹 등록 실패: ${error.message}`);

  revalidatePath(`/admin/products/${productId}`);
}

export async function updateOptionGroup(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = Number(formData.get('id'));
  const productId = Number(formData.get('product_id'));
  const name = String(formData.get('name') ?? '').trim();

  if (!id || !name) throw new Error('필수 값이 누락되었습니다.');

  const { error } = await supabase
    .from('product_option_groups')
    .update({ name })
    .eq('id', id);

  if (error) throw new Error(`옵션 그룹 수정 실패: ${error.message}`);

  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteOptionGroup(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = Number(formData.get('id'));
  const productId = Number(formData.get('product_id'));

  if (!id) throw new Error('ID가 누락되었습니다.');

  const { error } = await supabase
    .from('product_option_groups')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`옵션 그룹 삭제 실패: ${error.message}`);

  revalidatePath(`/admin/products/${productId}`);
}

// ──────────────────────────────────────────────────────────────
//  OPTION VALUE CRUD
// ──────────────────────────────────────────────────────────────

export async function createOptionValue(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const groupId = Number(formData.get('group_id'));
  const productId = Number(formData.get('product_id'));
  const value = String(formData.get('value') ?? '').trim();
  const priceDelta = Number(formData.get('price_delta') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const sortOrder = Number(formData.get('sort_order') ?? 0);

  if (!groupId || !value) throw new Error('필수 값이 누락되었습니다.');

  const { error } = await supabase
    .from('product_option_values')
    .insert({
      group_id: groupId,
      value,
      price_delta: Number.isNaN(priceDelta) ? 0 : priceDelta,
      stock: Number.isNaN(stock) ? 0 : stock,
      is_sold_out: false,
      sort_order: sortOrder,
    });

  if (error) throw new Error(`옵션 값 등록 실패: ${error.message}`);

  revalidatePath(`/admin/products/${productId}`);
}

export async function updateOptionValue(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = Number(formData.get('id'));
  const productId = Number(formData.get('product_id'));
  const value = String(formData.get('value') ?? '').trim();
  const priceDelta = Number(formData.get('price_delta') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const isSoldOut = formData.get('is_sold_out') === 'on';

  if (!id) throw new Error('ID가 누락되었습니다.');

  const { error } = await supabase
    .from('product_option_values')
    .update({
      value,
      price_delta: Number.isNaN(priceDelta) ? 0 : priceDelta,
      stock: Number.isNaN(stock) ? 0 : stock,
      is_sold_out: isSoldOut,
    })
    .eq('id', id);

  if (error) throw new Error(`옵션 값 수정 실패: ${error.message}`);

  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteOptionValue(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = Number(formData.get('id'));
  const productId = Number(formData.get('product_id'));

  if (!id) throw new Error('ID가 누락되었습니다.');

  const { error } = await supabase
    .from('product_option_values')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`옵션 값 삭제 실패: ${error.message}`);

  revalidatePath(`/admin/products/${productId}`);
}
