import { requireAdmin } from '@/src/server/admin-auth';
import type { AdminProduct } from '@/src/server/admin-products';
import type { AdminCategory } from '@/src/server/admin-categories';

const PRODUCT_COLUMNS =
  'id, name, slug, price, stock, short_description, description, category_id, is_active, is_new, top10_rank, is_sold_out, hide_when_sold_out, created_at';

/**
 * "세트상품" (slug = 'sets') 카테고리 + 그 하위 카테고리에 속한 상품들만 조회.
 *
 * 세트 카테고리가 없으면 빈 배열 반환 (관리자에게 안내).
 */
export async function getSetProducts(): Promise<{
  setCategory: AdminCategory | null;
  setCategories: AdminCategory[];
  products: AdminProduct[];
}> {
  const { supabase } = await requireAdmin();

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (catError) {
    throw new Error(`카테고리 조회 실패: ${catError.message}`);
  }

  const list = (categories ?? []) as AdminCategory[];
  const setRoot = list.find((c) => c.slug === 'sets') ?? null;

  if (!setRoot) {
    return { setCategory: null, setCategories: [], products: [] };
  }

  // sets 카테고리 + 그 직계 자식
  const setCategories = list.filter(
    (c) => c.id === setRoot.id || c.parent_id === setRoot.id,
  );

  const setCatIds = setCategories.map((c) => c.id);

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .in('category_id', setCatIds)
    .order('created_at', { ascending: false });

  if (prodError) {
    throw new Error(`세트 상품 조회 실패: ${prodError.message}`);
  }

  return {
    setCategory: setRoot,
    setCategories,
    products: (products ?? []) as AdminProduct[],
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
