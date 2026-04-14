import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('level', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    throw new Error(`카테고리 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminCategory[];
}

export async function createCategory(formData: FormData) {
  'use server';

  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const isActive = formData.get('is_active') === 'on';

  const parentRaw = String(formData.get('parent_id') ?? '').trim();
  const parent_id = parentRaw ? Number(parentRaw) : null;

  const level = parent_id ? 2 : 1;

  if (!name) {
    throw new Error('카테고리명을 입력해주세요.');
  }

  if (!slug) {
    throw new Error('슬러그를 입력해주세요.');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('categories').insert({
    name,
    slug,
    parent_id,
    level,
    sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
    is_active: isActive,
  });

  if (error) {
    throw new Error(`카테고리 등록 실패: ${error.message}`);
  }

  revalidatePath('/admin/categories');
}

export async function updateCategory(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const isActive = formData.get('is_active') === 'on';

  const parentRaw = String(formData.get('parent_id') ?? '').trim();
  const parent_id = parentRaw ? Number(parentRaw) : null;
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

  const supabase = await createClient();

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
    throw new Error(`카테고리 수정 실패: ${error.message}`);
  }

  revalidatePath('/admin/categories');
}

export async function deleteCategory(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('카테고리 ID가 올바르지 않습니다.');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    throw new Error(`카테고리 삭제 실패: ${error.message}`);
  }

  revalidatePath('/admin/categories');
}
