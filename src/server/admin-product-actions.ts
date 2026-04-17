'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/server/admin-auth';
import { writeAdminActivityLog } from '@/src/server/admin-activity-logs';
import { getAdminProductById } from '@/src/server/admin-products';

function parseTop10Rank(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const value = String(raw).trim();
  if (!value) return null;

  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  if (parsed < 1 || parsed > 10) {
    throw new Error('Top 10 순위는 1~10 사이여야 합니다.');
  }
  return Math.trunc(parsed);
}

function parseNullableText(raw: FormDataEntryValue | null): string | null {
  if (raw === null) return null;
  const value = String(raw).trim();
  return value ? value : null;
}

function parseNullableInt(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return Math.trunc(parsed);
}

/**
 * top10_rank 를 특정 상품에 지정하면, 같은 순위를 가진 다른 상품의 rank 는 NULL 로 비워준다.
 * 하나의 rank 는 한 상품만 차지하도록 보장.
 */
async function clearDuplicateTop10Rank(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rank: number,
  excludeProductId: number | null,
) {
  let query = supabase
    .from('products')
    .update({ top10_rank: null })
    .eq('top10_rank', rank);

  if (excludeProductId !== null) {
    query = query.neq('id', excludeProductId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`기존 Top 10 순위 정리 실패: ${error.message}`);
  }
}

export async function createProduct(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const shortDescription = parseNullableText(formData.get('short_description'));
  const description = parseNullableText(formData.get('description'));
  const categoryId = parseNullableInt(formData.get('category_id'));
  const isActive = formData.get('is_active') === 'on';
  const isNew = formData.get('is_new') === 'on';
  const top10Rank = parseTop10Rank(formData.get('top10_rank'));
  const isSoldOut = formData.get('is_sold_out') === 'on';
  const hideWhenSoldOut = formData.get('hide_when_sold_out') === 'on';

  if (!name) {
    throw new Error('상품명을 입력해주세요.');
  }

  if (!slug) {
    throw new Error('슬러그를 입력해주세요.');
  }

  if (categoryId === null) {
    throw new Error('카테고리를 선택해 주세요.');
  }

  const supabase = await createClient();

  if (top10Rank !== null) {
    await clearDuplicateTop10Rank(supabase, top10Rank, null);
  }

  const payload = {
    name,
    slug,
    price: Number.isNaN(price) ? 0 : price,
    stock: Number.isNaN(stock) ? 0 : stock,
    short_description: shortDescription,
    description,
    category_id: categoryId,
    is_active: isActive,
    is_new: isNew,
    top10_rank: top10Rank,
    is_sold_out: isSoldOut,
    hide_when_sold_out: hideWhenSoldOut,
  };

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    throw new Error(`상품 등록 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'create',
    entityType: 'product',
    entityId: String(inserted?.id ?? ''),
    afterData: payload,
    description: `상품 등록: ${name}`,
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function updateProduct(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const shortDescription = parseNullableText(formData.get('short_description'));
  const description = parseNullableText(formData.get('description'));
  const categoryId = parseNullableInt(formData.get('category_id'));
  const isActive = formData.get('is_active') === 'on';
  const isNew = formData.get('is_new') === 'on';
  const top10Rank = parseTop10Rank(formData.get('top10_rank'));
  const isSoldOut = formData.get('is_sold_out') === 'on';
  const hideWhenSoldOut = formData.get('hide_when_sold_out') === 'on';

  if (!id) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }

  if (!name) {
    throw new Error('상품명을 입력해주세요.');
  }

  if (!slug) {
    throw new Error('슬러그를 입력해주세요.');
  }

  if (categoryId === null) {
    throw new Error('카테고리를 선택해 주세요.');
  }

  const supabase = await createClient();

  const beforeSnapshot = await getAdminProductById(id);

  if (top10Rank !== null) {
    await clearDuplicateTop10Rank(supabase, top10Rank, id);
  }

  const payload = {
    name,
    slug,
    price: Number.isNaN(price) ? 0 : price,
    stock: Number.isNaN(stock) ? 0 : stock,
    short_description: shortDescription,
    description,
    category_id: categoryId,
    is_active: isActive,
    is_new: isNew,
    top10_rank: top10Rank,
    is_sold_out: isSoldOut,
    hide_when_sold_out: hideWhenSoldOut,
  };

  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id);

  if (error) {
    throw new Error(`상품 수정 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    entityId: String(id),
    beforeData: beforeSnapshot,
    afterData: payload,
    description: `상품 수정: ${name}`,
  });

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/products');
}

export async function deleteProduct(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }

  const supabase = await createClient();

  const beforeSnapshot = await getAdminProductById(id);

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    // Postgres FK 위반(23503): 주문 내역이 참조 중이어서 삭제 불가
    const isFkViolation =
      error.code === '23503' ||
      /foreign key/i.test(error.message) ||
      /order_items/i.test(error.message);

    if (isFkViolation) {
      throw new Error(
        '이미 주문된 상품이라 완전 삭제할 수 없습니다. 대신 상품 수정에서 "판매중으로 표시" 체크를 해제하면 쇼핑몰에서 숨겨집니다.',
      );
    }

    throw new Error(`상품 삭제 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'delete',
    entityType: 'product',
    entityId: String(id),
    beforeData: beforeSnapshot,
    description: `상품 삭제: ${beforeSnapshot?.name ?? ''}`,
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
}
