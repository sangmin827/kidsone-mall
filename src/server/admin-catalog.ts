import { requireAdmin } from '@/src/server/admin-auth';
import type { AdminCategory } from '@/src/server/admin-categories';
import type { AdminProduct } from '@/src/server/admin-products';

/**
 * 통합 카탈로그 트리 노드 타입.
 *
 * - 카테고리는 폴더 개념: 자식(하위 카테고리) + 상품(이 카테고리에 직접 연결된 상품)
 * - 상품은 파일 개념
 */
export type CatalogCategoryNode = AdminCategory & {
  product_count: number;
  child_count: number;
  /** 이 카테고리에 직접 연결된 상품들 */
  products: AdminProduct[];
  /** 하위 카테고리들 (재귀) */
  children: CatalogCategoryNode[];
};

export type CatalogTree = {
  roots: CatalogCategoryNode[];
  /** parent_id 가 NULL 이 아니지만, 해당 부모가 없는 하위 카테고리 */
  orphanCategories: CatalogCategoryNode[];
  /** category_id 가 NULL 이거나 어디에도 매핑되지 않은 상품 */
  orphanProducts: AdminProduct[];
  /** 평면화된 전체 카테고리 (카테고리 드롭다운용) */
  allCategories: AdminCategory[];
  /** 전체 상품 수, 카테고리 수 요약 */
  summary: {
    total_categories: number;
    total_products: number;
  };
};

const PRODUCT_COLUMNS =
  'id, name, slug, price, stock, short_description, description, category_id, is_active, is_new, top10_rank, is_sold_out, hide_when_sold_out, created_at';

/**
 * 관리자 카탈로그 전체 트리 조회.
 *
 * 한 번에:
 *   - 모든 카테고리 (level, sort_order 순)
 *   - 모든 상품 (최신순)
 * 을 가져와서 클라이언트가 다루기 쉬운 트리 형태로 가공한다.
 */
export async function getCatalogTree(): Promise<CatalogTree> {
  const { supabase } = await requireAdmin();

  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true }),
    supabase
      .from('products')
      .select(PRODUCT_COLUMNS)
      .order('created_at', { ascending: false }),
  ]);

  if (categoriesResult.error) {
    throw new Error(`카테고리 조회 실패: ${categoriesResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`상품 조회 실패: ${productsResult.error.message}`);
  }

  const categories = (categoriesResult.data ?? []) as AdminCategory[];
  const products = (productsResult.data ?? []) as AdminProduct[];

  // 카테고리별 상품 그룹핑
  const productsByCategory = new Map<number, AdminProduct[]>();
  const orphanProducts: AdminProduct[] = [];
  for (const p of products) {
    if (p.category_id === null || p.category_id === undefined) {
      orphanProducts.push(p);
      continue;
    }
    const list = productsByCategory.get(p.category_id) ?? [];
    list.push(p);
    productsByCategory.set(p.category_id, list);
  }

  // 카테고리 id → 노드 맵 (자식이 나중에 채워짐)
  const nodeMap = new Map<number, CatalogCategoryNode>();
  for (const c of categories) {
    nodeMap.set(c.id, {
      ...c,
      product_count: productsByCategory.get(c.id)?.length ?? 0,
      child_count: 0,
      products: productsByCategory.get(c.id) ?? [],
      children: [],
    });
  }

  const roots: CatalogCategoryNode[] = [];
  const orphanCategories: CatalogCategoryNode[] = [];

  // 카테고리를 부모-자식 관계로 연결
  for (const c of categories) {
    const node = nodeMap.get(c.id)!;
    if (c.parent_id === null || c.parent_id === undefined) {
      roots.push(node);
      continue;
    }
    const parentNode = nodeMap.get(c.parent_id);
    if (!parentNode) {
      orphanCategories.push(node);
      continue;
    }
    parentNode.children.push(node);
  }

  // child_count 계산 (자식 배열이 모두 채워진 다음)
  for (const node of nodeMap.values()) {
    node.child_count = node.children.length;
  }

  // 상품이 카테고리 참조는 있지만 그 카테고리가 사라진 경우 처리
  // (FK 가 있으면 실제로는 안 생기지만, 방어적으로)
  for (const p of products) {
    if (p.category_id === null || p.category_id === undefined) continue;
    if (!nodeMap.has(p.category_id)) {
      orphanProducts.push(p);
    }
  }

  return {
    roots,
    orphanCategories,
    orphanProducts,
    allCategories: categories,
    summary: {
      total_categories: categories.length,
      total_products: products.length,
    },
  };
}
