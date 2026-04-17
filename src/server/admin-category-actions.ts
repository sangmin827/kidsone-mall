'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/server/admin-auth';

function parseNullableInt(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return Math.trunc(parsed);
}

export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const isActive = formData.get('is_active') === 'on';
  const parent_id = parseNullableInt(formData.get('parent_id'));
  const level = parent_id ? 2 : 1;

  if (!name) {
    throw new Error('카테고리명을 입력해주세요.');
  }

  if (!slug) {
    throw new Error('슬러그를 입력해주세요.');
  }

  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    parent_id,
    level,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
    is_active: isActive,
  });

  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
      throw new Error(
        `이미 사용 중인 슬러그입니다: "${slug}". 다른 슬러그를 입력해 주세요.`,
      );
    }
    throw new Error(`카테고리 등록 실패: ${error.message}`);
  }

  revalidatePath('/admin/categories');
  revalidatePath('/');
}

export async function updateCategory(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const isActive = formData.get('is_active') === 'on';
  const parent_id = parseNullableInt(formData.get('parent_id'));
  const level = parent_id ? 2 : 1;

  if (!id) {
    throw new Error('카테고리 ID가 올바르지 않습니다.');
  }

  if (!name) {
    throw new Error('카테고리명을 입력해주세요.');
  }

  if (!slug) {
    throw new Error('슬러그를 입력해주세요.');
  }

  // 자기 자신을 부모로 지정 방지
  if (parent_id === id) {
    throw new Error('자기 자신을 상위 카테고리로 지정할 수 없습니다.');
  }

  const { error } = await supabase
    .from('categories')
    .update({
      name,
      slug,
      parent_id,
      level,
      sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
      is_active: isActive,
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
      throw new Error(
        `이미 사용 중인 슬러그입니다: "${slug}". 다른 슬러그를 입력해 주세요.`,
      );
    }
    throw new Error(`카테고리 수정 실패: ${error.message}`);
  }

  revalidatePath('/admin/categories');
  revalidatePath('/');
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('카테고리 ID가 올바르지 않습니다.');
  }

  // 삭제 전: 상품이 연결돼 있는지 / 하위 카테고리가 있는지 먼저 확인해서 친화 메시지 제공
  const [{ count: productCount }, { count: childCount }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id),
    supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id),
  ]);

  if ((productCount ?? 0) > 0) {
    throw new Error(
      `이 카테고리에 연결된 상품이 ${productCount}개 있어서 삭제할 수 없습니다. 상품들을 다른 카테고리로 옮기거나, 카테고리를 "사용 안 함" 으로 전환해 주세요.`,
    );
  }

  if ((childCount ?? 0) > 0) {
    throw new Error(
      `이 카테고리 아래에 하위 카테고리가 ${childCount}개 있어서 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제하거나 다른 상위로 옮겨 주세요.`,
    );
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    // FK 위반 등 예외 상황
    if (error.code === '23503' || /foreign key/i.test(error.message)) {
      throw new Error(
        '이 카테고리는 다른 데이터와 연결돼 있어 삭제할 수 없습니다. 대신 "사용 안 함" 으로 전환해 주세요.',
      );
    }
    throw new Error(`카테고리 삭제 실패: ${error.message}`);
  }

  revalidatePath('/admin/categories');
  revalidatePath('/');
}

/**
 * 같은 level + 같은 parent 범위 안에서 인접 카테고리와 sort_order 교환.
 */
export async function moveCategory(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get('id'));
  const direction = String(formData.get('direction'));

  if (!id) {
    throw new Error('카테고리 ID가 올바르지 않습니다.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('이동 방향이 올바르지 않습니다.');
  }

  const { data: target, error: targetError } = await supabase
    .from('categories')
    .select('id, parent_id, sort_order')
    .eq('id', id)
    .single();

  if (targetError || !target) {
    throw new Error('카테고리를 찾을 수 없습니다.');
  }

  let query = supabase
    .from('categories')
    .select('id, sort_order')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  query =
    target.parent_id === null
      ? query.is('parent_id', null)
      : query.eq('parent_id', target.parent_id);

  const { data: siblings, error: siblingsError } = await query;

  if (siblingsError || !siblings) {
    throw new Error('카테고리 목록 조회 실패');
  }

  const index = siblings.findIndex((s) => s.id === id);
  if (index === -1) return;

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= siblings.length) return;

  const current = siblings[index];
  const other = siblings[swapIndex];

  // sort_order 교환
  await supabase
    .from('categories')
    .update({ sort_order: other.sort_order })
    .eq('id', current.id);

  await supabase
    .from('categories')
    .update({ sort_order: current.sort_order })
    .eq('id', other.id);

  revalidatePath('/admin/categories');
  revalidatePath('/');
}

/**
 * is_active 토글.
 */
export async function toggleCategoryActive(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = Number(formData.get('id'));
  const nextActive = formData.get('next_active') === 'true';

  if (!id) {
    throw new Error('카테고리 ID가 올바르지 않습니다.');
  }

  const { error } = await supabase
    .from('categories')
    .update({ is_active: nextActive })
    .eq('id', id);

  if (error) {
    throw new Error(`카테고리 상태 변경 실패: ${error.message}`);
  }

  revalidatePath('/admin/categories');
  revalidatePath('/');
}
