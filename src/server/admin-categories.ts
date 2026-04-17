import { requireAdmin } from '@/src/server/admin-auth';

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

export type AdminCategoryWithCount = AdminCategory & {
  product_count: number;
  child_count: number;
};

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const { supabase } = await requireAdmin();

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

/**
 * 카테고리 목록 + 각 카테고리에 연결된 상품 수 + 하위 카테고리 수 를 함께 조회.
 * 삭제/UI 표시 용도로 사용.
 */
export async function getAdminCategoriesWithCounts(): Promise<
  AdminCategoryWithCount[]
> {
  const { supabase } = await requireAdmin();

  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true }),
    supabase.from('products').select('category_id'),
  ]);

  if (categoriesResult.error) {
    throw new Error(`카테고리 조회 실패: ${categoriesResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`상품 카운트 조회 실패: ${productsResult.error.message}`);
  }

  const categories = (categoriesResult.data ?? []) as AdminCategory[];
  const products = (productsResult.data ?? []) as Array<{
    category_id: number | null;
  }>;

  // 상품 수 집계
  const productCountMap = new Map<number, number>();
  for (const p of products) {
    if (p.category_id === null) continue;
    productCountMap.set(
      p.category_id,
      (productCountMap.get(p.category_id) ?? 0) + 1,
    );
  }

  // 하위 카테고리 수 집계
  const childCountMap = new Map<number, number>();
  for (const c of categories) {
    if (c.parent_id === null) continue;
    childCountMap.set(c.parent_id, (childCountMap.get(c.parent_id) ?? 0) + 1);
  }

  return categories.map((c) => ({
    ...c,
    product_count: productCountMap.get(c.id) ?? 0,
    child_count: childCountMap.get(c.id) ?? 0,
  }));
}
