import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
};

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, stock, is_active, created_at')
    .order('id', { ascending: false });

  if (error) {
    throw new Error(`상품 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminProduct[];
}

export async function getAdminProductById(
  id: number,
): Promise<AdminProduct | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, stock, is_active, created_at')
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data as AdminProduct;
}

export async function createProduct(formData: FormData) {
  'use server';

  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const isActive = formData.get('is_active') === 'on';

  if (!name) {
    throw new Error('상품명을 입력해주세요.');
  }

  if (!slug) {
    throw new Error('슬러그를 입력해주세요.');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('products').insert({
    name,
    slug,
    price: Number.isNaN(price) ? 0 : price,
    stock: Number.isNaN(stock) ? 0 : stock,
    is_active: isActive,
  });

  if (error) {
    throw new Error(`상품 등록 실패: ${error.message}`);
  }

  revalidatePath('/admin/products');
}

export async function updateProduct(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim();
  const price = Number(formData.get('price') ?? 0);
  const stock = Number(formData.get('stock') ?? 0);
  const isActive = formData.get('is_active') === 'on';

  if (!id) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }

  if (!name) {
    throw new Error('상품명을 입력해주세요.');
  }

  if (!slug) {
    throw new Error('슬러그를 입력해주세요.');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('products')
    .update({
      name,
      slug,
      price: Number.isNaN(price) ? 0 : price,
      stock: Number.isNaN(stock) ? 0 : stock,
      is_active: isActive,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`상품 수정 실패: ${error.message}`);
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
}

export async function deleteProduct(formData: FormData) {
  'use server';

  const id = Number(formData.get('id'));

  if (!id) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }

  const supabase = await createClient();

  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    throw new Error(`상품 삭제 실패: ${error.message}`);
  }

  revalidatePath('/admin/products');
}
