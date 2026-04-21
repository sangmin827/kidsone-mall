import { requireAdmin } from '@/src/server/admin-auth';
import type { AdminProduct } from '@/src/server/admin-products';
import type { AdminCategory } from '@/src/server/admin-categories';

const PRODUCT_COLUMNS =
  'id, name, slug, price, stock, short_description, description, category_id, is_active, is_new, is_set, top10_rank, is_sold_out, hide_when_sold_out, created_at';

/**
 * is_set = true 인 상품들을 조회 (카테고리와 무관).
 * 관리자 세트 상품 관리 페이지에서 사용.
 */
export async function getSetProducts(): Promise<{
  products: AdminProduct[];
  categories: AdminCategory[];
}> {
  const { supabase } = await requireAdmin();

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('is_set', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(`세트 상품 조회 실패: ${productsResult.error.message}`);
  }

  return {
    products: (productsResult.data ?? []) as AdminProduct[],
    categories: (categoriesResult.data ?? []) as AdminCategory[],
  };
}

/**
 * 전체 상품 + 이름 / 소속 카테고리명 까지 한꺼번에.
 * 신상품 / Top 10 관리 페이지에서 공통으로 사용.
 */
export async function getAllProductsWithCategoryName(): Promise<
  Array<AdminProduct & { category_name: string | null }>
> {
  const { supabase } = await requireAdmin();

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name'),
  ]);

  if (productsResult.error) {
    throw new Error(`상품 조회 실패: ${productsResult.error.message}`);
  }
  if (categoriesResult.error) {
    throw new Error(`카테고리 조회 실패: ${categoriesResult.error.message}`);
  }

  const products = (productsResult.data ?? []) as AdminProduct[];
  const categoryNameMap = new Map<number, string>();
  for (const c of (categoriesResult.data ?? []) as Array<{
    id: number;
    name: string;
  }>) {
    categoryNameMap.set(c.id, c.name);
  }

  return products.map((p) => ({
    ...p,
    category_name:
      p.category_id !== null ? (categoryNameMap.get(p.category_id) ?? null) : null,
  }));
}
