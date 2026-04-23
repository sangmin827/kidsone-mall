'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/server/admin-auth';
import { writeAdminActivityLog } from '@/src/server/admin-activity-logs';
import { getAdminProductById } from '@/src/server/admin-products';

/**
 * 관리자 카탈로그(통합 뷰)에서 사용하는 "가벼운" 부분 업데이트 액션 모음.
 *
 * 기존 updateProduct/updateCategory 는 폼 전체를 받는 반면,
 * 여기 있는 액션들은 한 번에 한두 필드만 빠르게 바꾼다 (인라인 편집 / 드롭다운 즉시 저장).
 */

function toNullableInt(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return Math.trunc(parsed);
}

/* ===================== 상품 인라인 편집 ===================== */

/**
 * 상품의 카테고리만 바꾼다 (드롭다운 즉시 저장).
 */
export async function quickChangeProductCategory(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  const categoryId = toNullableInt(formData.get('category_id'));

  if (!id) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }
  if (categoryId === null) {
    throw new Error('카테고리를 선택해 주세요.');
  }

  const supabase = await createClient();
  const before = await getAdminProductById(id);

  const { error } = await supabase
    .from('products')
    .update({ category_id: categoryId })
    .eq('id', id);

  if (error) {
    throw new Error(`카테고리 변경 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    entityId: String(id),
    beforeData: { category_id: before?.category_id ?? null },
    afterData: { category_id: categoryId },
    description: `상품 카테고리 변경: ${before?.name ?? id}`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
}

/**
 * 상품 이름/가격 빠른 수정 (모달에서 사용).
 * name 과 price 는 optional — 전달된 것만 반영.
 */
export async function quickEditProductBasics(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  if (!id) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }

  const rawName = formData.get('name');
  const rawPrice = formData.get('price');

  const payload: { name?: string; price?: number } = {};

  if (rawName !== null) {
    const name = String(rawName).trim();
    if (!name) {
      throw new Error('상품명을 입력해 주세요.');
    }
    payload.name = name;
  }

  if (rawPrice !== null && String(rawPrice).trim() !== '') {
    const price = Number(rawPrice);
    if (Number.isNaN(price) || price < 0) {
      throw new Error('가격은 0 이상의 숫자여야 합니다.');
    }
    payload.price = Math.trunc(price);
  }

  if (Object.keys(payload).length === 0) {
    return; // 아무 것도 안 바뀜
  }

  const supabase = await createClient();
  const before = await getAdminProductById(id);

  const { error } = await supabase.from('products').update(payload).eq('id', id);

  if (error) {
    throw new Error(`상품 수정 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    entityId: String(id),
    beforeData: before
      ? { name: before.name, price: before.price }
      : undefined,
    afterData: payload,
    description: `상품 빠른 수정: ${payload.name ?? before?.name ?? id}`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/products');
}

/**
 * 상품 is_active 토글 (노출/숨김).
 */
export async function quickToggleProductActive(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  const nextActive = formData.get('next_active') === 'true';

  if (!id) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({ is_active: nextActive })
    .eq('id', id);

  if (error) {
    throw new Error(`상품 상태 변경 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    entityId: String(id),
    afterData: { is_active: nextActive },
    description: `상품 ${nextActive ? '노출' : '숨김'} 전환`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

/* ===================== 카테고리 이름/슬러그 빠른 수정 ===================== */

/**
 * 카테고리 이름(+선택적으로 슬러그)만 빠르게 바꾼다 — 인라인 모달용.
 */
export async function quickEditCategoryBasics(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  if (!id) {
    throw new Error('카테고리 ID가 올바르지 않습니다.');
  }

  const rawName = formData.get('name');
  const rawSlug = formData.get('slug');

  const payload: { name?: string; slug?: string } = {};

  if (rawName !== null) {
    const name = String(rawName).trim();
    if (!name) {
      throw new Error('카테고리명을 입력해 주세요.');
    }
    payload.name = name;
  }

  if (rawSlug !== null) {
    const slug = String(rawSlug).trim();
    if (!slug) {
      throw new Error('슬러그를 입력해 주세요.');
    }
    payload.slug = slug;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  const supabase = await createClient();

  const { data: updatedRows, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('id');

  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
      throw new Error(
        `이미 사용 중인 슬러그입니다: "${payload.slug ?? ''}". 다른 슬러그를 입력해 주세요.`,
      );
    }
    throw new Error(`카테고리 수정 실패: ${error.message}`);
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error(
      '카테고리 수정에 반영된 내역이 없습니다. 관리자 권한 (RLS 정책) 또는 삭제된 카테고리일 수 있어요.',
    );
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'category',
    entityId: String(id),
    afterData: payload,
    description: `카테고리 빠른 수정`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/categories');
  revalidatePath('/');
}

/* ===================== 카탈로그 상품 빠른 토글 ===================== */

/**
 * 신상품 여부 토글.
 */
export async function quickToggleProductNew(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  const nextNew = formData.get('next_new') === 'true';

  if (!id) throw new Error('상품 ID가 올바르지 않습니다.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .update({ is_new: nextNew })
    .eq('id', id);

  if (error) throw new Error(`신상품 설정 실패: ${error.message}`);

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    entityId: String(id),
    afterData: { is_new: nextNew },
    description: `상품 신상품 ${nextNew ? '설정' : '해제'}`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
}

/**
 * Top10 여부 토글 — 추가 시 현재 최대 순위+1 로 맨 아래에 등록, 제거 시 null.
 */
export async function quickToggleProductTop10(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  const add = formData.get('add') === 'true';

  if (!id) throw new Error('상품 ID가 올바르지 않습니다.');

  const supabase = await createClient();

  let newRank: number | null = null;

  if (add) {
    // 현재 최대 순위 조회
    const { data: maxData } = await supabase
      .from('products')
      .select('top10_rank')
      .not('top10_rank', 'is', null)
      .order('top10_rank', { ascending: false })
      .limit(1)
      .single();

    newRank = maxData ? (maxData.top10_rank as number) + 1 : 1;
  }

  const { error } = await supabase
    .from('products')
    .update({ top10_rank: newRank })
    .eq('id', id);

  if (error) throw new Error(`Top10 설정 실패: ${error.message}`);

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    entityId: String(id),
    afterData: { top10_rank: newRank },
    description: `상품 Top10 ${add ? `추가 (순위 ${newRank})` : '제거'}`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath('/admin/products/top10');
  revalidatePath('/products');
  revalidatePath('/');
}

/**
 * 품절 여부 토글.
 */
export async function quickToggleProductSoldOut(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const id = Number(formData.get('id'));
  const nextSoldOut = formData.get('next_sold_out') === 'true';

  if (!id) throw new Error('상품 ID가 올바르지 않습니다.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .update({ is_sold_out: nextSoldOut })
    .eq('id', id);

  if (error) throw new Error(`품절 설정 실패: ${error.message}`);

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    entityId: String(id),
    afterData: { is_sold_out: nextSoldOut },
    description: `상품 품절 ${nextSoldOut ? '처리' : '해제'}`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
}
