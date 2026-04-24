'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/server/admin-auth';
import { writeAdminActivityLog } from '@/src/server/admin-activity-logs';

const BUCKET = 'product-images';
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (클라이언트 하드 리밋과 일치)

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

/**
 * 관리자 페이지에서 상품 이미지 한 장을 업로드한다.
 * - formData: productId (number), file (File)
 * - 첫 번째 이미지이면 자동으로 is_thumbnail = true
 * - sort_order 는 기존 최대값 + 1
 */
export async function uploadProductImage(formData: FormData) {
  const { supabase, adminUserId } = await requireAdmin();

  const productIdRaw = formData.get('productId');
  const productId = Number(productIdRaw);
  const file = formData.get('file');

  if (!productId) {
    throw new Error('상품 ID가 올바르지 않습니다.');
  }

  if (!(file instanceof File)) {
    throw new Error('업로드할 파일이 없습니다.');
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('JPEG / PNG / WebP 이미지만 업로드할 수 있습니다.');
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('이미지 용량은 10MB 이하여야 합니다.');
  }

  // Storage 경로: products/{productId}/{timestamp-random}.{ext}
  const ext = extFromMime(file.type);
  const storagePath = `products/${productId}/${randomId()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  // 현재 이미지 개수 + 썸네일 존재 여부 조회
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('id, sort_order, is_thumbnail')
    .eq('product_id', productId);

  const nextSortOrder = existingImages?.length
    ? Math.max(...existingImages.map((img) => img.sort_order ?? 0)) + 1
    : 0;

  const hasThumbnail = (existingImages ?? []).some((img) => img.is_thumbnail);

  const imageType = String(formData.get('imageType') ?? 'gallery');

  const { error: insertError } = await supabase.from('product_images').insert({
    product_id: productId,
    image_url: publicUrl,
    storage_path: storagePath,
    sort_order: nextSortOrder,
    is_thumbnail: imageType === 'gallery' && !hasThumbnail, // 갤러리 첫 이미지면 썸네일로 자동 지정
    image_type: imageType,
  });

  if (insertError) {
    // DB 실패 시 Storage 도 롤백
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`이미지 정보 저장 실패: ${insertError.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'upload_image',
    entityType: 'product',
    entityId: String(productId),
    description: `상품 이미지 업로드`,
  });

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/products');
}

/**
 * 상품 이미지 하나를 삭제한다. (DB + Storage 양쪽)
 */
export async function deleteProductImage(formData: FormData) {
  const { supabase, adminUserId } = await requireAdmin();

  const imageId = Number(formData.get('imageId'));

  if (!imageId) {
    throw new Error('이미지 ID가 올바르지 않습니다.');
  }

  const { data: image, error: fetchError } = await supabase
    .from('product_images')
    .select('id, product_id, storage_path, is_thumbnail')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) {
    throw new Error('삭제할 이미지를 찾을 수 없습니다.');
  }

  // Storage 파일 먼저 삭제
  if (image.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([image.storage_path]);

    // Storage 삭제 실패는 무시하지 않고 로그만 남김 (이미 사라진 경우도 있을 수 있음)
    if (storageError) {
      console.warn('Storage 이미지 삭제 실패:', storageError.message);
    }
  }

  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  if (deleteError) {
    throw new Error(`이미지 삭제 실패: ${deleteError.message}`);
  }

  // 방금 지운 게 썸네일이면, 남은 이미지 중 가장 앞쪽 것을 썸네일로 자동 승격
  if (image.is_thumbnail) {
    const { data: remaining } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', image.product_id)
      .order('sort_order', { ascending: true })
      .limit(1);

    const promoteId = remaining?.[0]?.id;
    if (promoteId) {
      await supabase
        .from('product_images')
        .update({ is_thumbnail: true })
        .eq('id', promoteId);
    }
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'delete_image',
    entityType: 'product',
    entityId: String(image.product_id),
    description: '상품 이미지 삭제',
  });

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${image.product_id}`);
  revalidatePath('/products');
}

/**
 * 특정 이미지를 썸네일(대표 이미지)로 지정한다.
 * 나머지 이미지의 is_thumbnail 은 모두 false 로 바뀜.
 */
export async function setThumbnailImage(formData: FormData) {
  const { supabase, adminUserId } = await requireAdmin();

  const imageId = Number(formData.get('imageId'));
  const productId = Number(formData.get('productId'));

  if (!imageId || !productId) {
    throw new Error('이미지 ID가 올바르지 않습니다.');
  }

  // 같은 상품의 다른 이미지는 전부 false
  const { error: resetError } = await supabase
    .from('product_images')
    .update({ is_thumbnail: false })
    .eq('product_id', productId);

  if (resetError) {
    throw new Error(`썸네일 초기화 실패: ${resetError.message}`);
  }

  const { error: setError } = await supabase
    .from('product_images')
    .update({ is_thumbnail: true })
    .eq('id', imageId);

  if (setError) {
    throw new Error(`썸네일 지정 실패: ${setError.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'set_thumbnail',
    entityType: 'product',
    entityId: String(productId),
    description: '대표 이미지 변경',
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/products');
}

/**
 * 이미지 순서를 변경한다.
 * formData: productId, direction('up' | 'down'), imageId
 * 인접한 이미지와 sort_order 를 교환.
 */
export async function moveProductImage(formData: FormData) {
  const { supabase } = await requireAdmin();

  const imageId = Number(formData.get('imageId'));
  const productId = Number(formData.get('productId'));
  const direction = String(formData.get('direction'));

  if (!imageId || !productId) {
    throw new Error('요청이 올바르지 않습니다.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('이동 방향이 올바르지 않습니다.');
  }

  const imageType = String(formData.get('imageType') ?? 'gallery');

  const { data: images, error } = await supabase
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', productId)
    .eq('image_type', imageType)
    .order('sort_order', { ascending: true });

  if (error || !images) {
    throw new Error('이미지 목록 조회 실패');
  }

  const index = images.findIndex((img) => img.id === imageId);
  if (index === -1) {
    throw new Error('이미지를 찾을 수 없습니다.');
  }

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= images.length) {
    // 이미 맨 앞/뒤면 아무 것도 안 함 (에러 아님)
    return;
  }

  const current = images[index];
  const other = images[swapIndex];

  // 두 이미지의 sort_order 값을 맞교환
  await supabase
    .from('product_images')
    .update({ sort_order: other.sort_order })
    .eq('id', current.id);

  await supabase
    .from('product_images')
    .update({ sort_order: current.sort_order })
    .eq('id', other.id);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath('/products');
}
