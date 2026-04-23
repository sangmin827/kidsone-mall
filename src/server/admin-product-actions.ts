'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/server/admin-auth';
import { writeAdminActivityLog } from '@/src/server/admin-activity-logs';
import { getAdminProductById } from '@/src/server/admin-products';

const CHO  = ['g','gg','n','d','dd','r','m','b','bb','s','ss','','j','jj','ch','k','t','p','h'];
const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','weo','we','wi','yu','eu','ui','i'];
const JONG = ['','g','gg','gs','n','nj','nh','d','r','rg','rm','rb','rs','rt','rp','rh','m','b','bs','s','ss','ng','j','ch','k','t','p','h'];

function nameToSlug(name: string): string {
  let romanized = '';
  for (const ch of name) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const syl = code - 0xac00;
      const jong = syl % 28;
      const jung = Math.floor(syl / 28) % 21;
      const cho  = Math.floor(syl / 28 / 21);
      romanized += CHO[cho] + JUNG[jung] + JONG[jong];
    } else {
      romanized += ch;
    }
  }
  return romanized
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseTop10Rank(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  if (parsed < 1 || parsed > 100) throw new Error('Top 순위는 1~100 사이여야 합니다.');
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

async function clearDuplicateTop10Rank(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rank: number,
  excludeProductId: number | null,
) {
  let query = supabase.from('products').update({ top10_rank: null }).eq('top10_rank', rank);
  if (excludeProductId !== null) query = query.neq('id', excludeProductId);
  const { error } = await query;
  if (error) throw new Error(`기존 Top 10 순위 정리 실패: ${error.message}`);
}

export async function createProduct(formData: FormData): Promise<{ id: number }> {
  const { adminUserId } = await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const shortDescription = parseNullableText(formData.get('short_description'));
  const description = parseNullableText(formData.get('description'));
  const categoryId = parseNullableInt(formData.get('category_id'));
  const isActive = formData.get('is_active') === 'on';
  const isNew = formData.get('is_new') === 'on';
  const isSet = formData.get('is_set') === 'on';
  const top10Rank = parseTop10Rank(formData.get('top10_rank'));
  const isSoldOut = formData.get('is_sold_out') === 'on';
  const hideWhenSoldOut = formData.get('hide_when_sold_out') === 'on';

  if (!name) throw new Error('상품명을 입력해주세요.');

  const slug = nameToSlug(name);
  if (!slug) throw new Error('슬러그를 생성할 수 없습니다. 상품명을 확인해주세요.');

  const supabase = await createClient();

  if (top10Rank !== null) await clearDuplicateTop10Rank(supabase, top10Rank, null);

  const payload = {
    name, slug,
    price: Number.isNaN(price) ? 0 : price,
    stock: Number.isNaN(stock) ? 0 : stock,
    short_description: shortDescription,
    description,
    category_id: categoryId,
    is_active: isActive,
    is_new: isNew,
    is_set: isSet,
    top10_rank: top10Rank,
    is_sold_out: isSoldOut,
    hide_when_sold_out: hideWhenSoldOut,
  };

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw new Error(`상품 등록 실패: ${error.message}`);

  await writeAdminActivityLog({
    adminUserId,
    action: 'create',
    entityType: 'product',
    entityId: String(inserted?.id ?? ''),
    afterData: payload,
    description: `상품 등록: ${name}`,
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/products/sets');
  revalidatePath('/products');
  revalidatePath('/sets');

  return { id: inserted.id };
}

export async function updateProduct(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const shortDescription = parseNullableText(formData.get('short_description'));
  const description = parseNullableText(formData.get('description'));
  const categoryId = parseNullableInt(formData.get('category_id'));
  const isActive = formData.get('is_active') === 'on';
  const isNew = formData.get('is_new') === 'on';
  const isSet = formData.get('is_set') === 'on';
  const top10Rank = parseTop10Rank(formData.get('top10_rank'));
  const isSoldOut = formData.get('is_sold_out') === 'on';
  const hideWhenSoldOut = formData.get('hide_when_sold_out') === 'on';

  if (!id) throw new Error('상품 ID가 올바르지 않습니다.');
  if (!name) throw new Error('상품명을 입력해주세요.');

  const supabase = await createClient();
  const beforeSnapshot = await getAdminProductById(id);

  if (top10Rank !== null) await clearDuplicateTop10Rank(supabase, top10Rank, id);

  const newSlug = nameToSlug(name);
  const slug = newSlug || (beforeSnapshot?.slug ?? '');

  const payload = {
    name, slug,
    price: Number.isNaN(price) ? 0 : price,
    stock: Number.isNaN(stock) ? 0 : stock,
    short_description: shortDescription,
    description,
    category_id: categoryId,
    is_active: isActive,
    is_new: isNew,
    is_set: isSet,
    top10_rank: top10Rank,
    is_sold_out: isSoldOut,
    hide_when_sold_out: hideWhenSoldOut,
  };

  const { error } = await supabase.from('products').update(payload).eq('id', id);
  if (error) throw new Error(`상품 수정 실패: ${error.message}`);

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
  revalidatePath('/admin/products/sets');
  revalidatePath('/products');
  revalidatePath('/sets');
}

export async function deleteProduct(formData: FormData) {
  const { adminUserId } = await requireAdmin();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('상품 ID가 올바르지 않습니다.');

  const supabase = await createClient();
  const beforeSnapshot = await getAdminProductById(id);
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    const isFkViolation =
      error.code === '23503' ||
      /foreign key/i.test(error.message) ||
      /order_items/i.test(error.message);
    if (isFkViolation) throw new Error('이미 주문된 상품이라 완전 삭제할 수 없습니다. 대신 상품 수정에서 "판매중으로 표시" 체크를 해제하면 쇼핑몰에서 숨겨집니다.');
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
  revalidatePath('/admin/products/sets');
  revalidatePath('/products');
  revalidatePath('/sets');
}
