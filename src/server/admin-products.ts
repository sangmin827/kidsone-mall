import { requireAdmin } from '@/src/server/admin-auth';

export type AdminProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  is_thumbnail: boolean;
  sort_order: number;
  storage_path: string | null;
  image_type: "gallery" | "detail";
};

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  short_description: string | null;
  description: string | null;
  category_id: number | null;
  is_active: boolean;
  is_new: boolean;
  is_set: boolean;
  top10_rank: number | null;
  is_sold_out: boolean;
  hide_when_sold_out: boolean;
  created_at: string;
  images?: AdminProductImage[];
};

const PRODUCT_COLUMNS =
  'id, name, slug, price, stock, short_description, description, category_id, is_active, is_new, is_set, top10_rank, is_sold_out, hide_when_sold_out, created_at';

const PRODUCT_IMAGE_COLUMNS =
  'id, product_id, image_url, is_thumbnail, sort_order, storage_path, image_type';

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('id', { ascending: false });

  if (error) {
    throw new Error(`상품 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminProduct[];
}

export async function getAdminProductById(
  id: number,
): Promise<AdminProduct | null> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const { data: images } = await supabase
    .from('product_images')
    .select(PRODUCT_IMAGE_COLUMNS)
    .eq('product_id', id)
    .order('sort_order', { ascending: true });

  return {
    ...(data as Omit<AdminProduct, 'images'>),
    images: (images ?? []) as AdminProductImage[],
  };
}

export async function getAdminProductImages(
  productId: number,
): Promise<AdminProductImage[]> {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('product_images')
    .select(PRODUCT_IMAGE_COLUMNS)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`상품 이미지 조회 실패: ${error.message}`);
  }

  return (data ?? []) as AdminProductImage[];
}
