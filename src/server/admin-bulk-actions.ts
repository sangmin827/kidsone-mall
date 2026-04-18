'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/lib/supabase/server';
import { requireAdmin } from '@/src/server/admin-auth';
import { writeAdminActivityLog } from '@/src/server/admin-activity-logs';

/**
 * 신상품 배지 일괄 설정.
 * - checkedIds: 신상품으로 표시할 상품 ID 목록
 * - allIds: 이 배치 저장에서 관리 대상이 되는 전체 상품 ID 목록
 *   (allIds 중 checkedIds 에 포함되지 않은 것은 is_new=false 로 내려감)
 */
export async function bulkSetNewProducts(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const checkedRaw = String(formData.get('checked_ids') ?? '').trim();
  const allRaw = String(formData.get('all_ids') ?? '').trim();

  const checkedIds = parseIdList(checkedRaw);
  const allIds = parseIdList(allRaw);

  if (allIds.length === 0) {
    return;
  }

  const checkedSet = new Set(checkedIds);
  const uncheckedIds = allIds.filter((id) => !checkedSet.has(id));

  const supabase = await createClient();

  // 체크된 애들 → is_new = true
  if (checkedIds.length > 0) {
    const { error } = await supabase
      .from('products')
      .update({ is_new: true })
      .in('id', checkedIds);

    if (error) {
      throw new Error(`신상품 지정 실패: ${error.message}`);
    }
  }

  // 체크 해제된 애들 → is_new = false
  if (uncheckedIds.length > 0) {
    const { error } = await supabase
      .from('products')
      .update({ is_new: false })
      .in('id', uncheckedIds);

    if (error) {
      throw new Error(`신상품 해제 실패: ${error.message}`);
    }
  }

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    afterData: {
      is_new_on: checkedIds.length,
      is_new_off: uncheckedIds.length,
    },
    description: `신상품 배치 설정: 지정 ${checkedIds.length}개 / 해제 ${uncheckedIds.length}개`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath('/admin/products/new-arrivals');
  revalidatePath('/products');
  revalidatePath('/');
}

/**
 * Top 1~100 순위 일괄 설정.
 *
 * rankings: JSON 문자열 — `[{id: number, rank: number}, ...]`
 * allIds: 이 페이지에서 관리 대상이 된 전체 상품 ID (여기서 rank 가 빠져 있으면 NULL 처리)
 *
 * DB 제약: products.top10_rank CHECK 는 1~100 으로 완화되어 있어야 함.
 */
export async function bulkSetTop100Rankings(formData: FormData) {
  const { adminUserId } = await requireAdmin();

  const rankingsRaw = String(formData.get('rankings') ?? '').trim();
  const allRaw = String(formData.get('all_ids') ?? '').trim();

  let rankings: Array<{ id: number; rank: number }>;
  try {
    const parsed = JSON.parse(rankingsRaw);
    if (!Array.isArray(parsed)) throw new Error('배열이 아님');
    rankings = parsed
      .map((r) => ({ id: Number(r.id), rank: Number(r.rank) }))
      .filter(
        (r) =>
          Number.isFinite(r.id) &&
          Number.isFinite(r.rank) &&
          r.rank >= 1 &&
          r.rank <= 100,
      );
  } catch {
    throw new Error('순위 데이터가 올바르지 않습니다.');
  }

  const allIds = parseIdList(allRaw);
  const rankedIds = new Set(rankings.map((r) => r.id));

  const supabase = await createClient();

  // 먼저 이번에 관리 대상이 된 상품들의 기존 rank 를 모두 NULL 로 초기화.
  // (rank 1-100 밖의 잔여물 방지 + 동일 rank 충돌 방지)
  const idsToReset = allIds.length > 0 ? allIds : Array.from(rankedIds);
  if (idsToReset.length > 0) {
    const { error } = await supabase
      .from('products')
      .update({ top10_rank: null })
      .in('id', idsToReset);
    if (error) {
      throw new Error(`기존 순위 초기화 실패: ${error.message}`);
    }
  }

  // rank 부여: rank 당 update 1회씩 (상품 수가 최대 100개라 성능 부담 없음)
  for (const r of rankings) {
    const { error } = await supabase
      .from('products')
      .update({ top10_rank: r.rank })
      .eq('id', r.id);
    if (error) {
      throw new Error(
        `순위 저장 실패 (상품 ${r.id} / ${r.rank}위): ${error.message}`,
      );
    }
  }

  // rank 대상에서 빠졌지만 allIds 에는 있는 상품은 이미 위에서 null 처리됨.
  // rank 대상에 있었지만 allIds 에 없는 상품(드묾)도 일단 정상 반영됨.
  void rankedIds;

  await writeAdminActivityLog({
    adminUserId,
    action: 'update',
    entityType: 'product',
    afterData: {
      ranked_count: rankings.length,
      cleared_count: idsToReset.length - rankings.length,
    },
    description: `Top 1~100 순위 배치 저장: ${rankings.length}개 지정`,
  });

  revalidatePath('/admin/catalog');
  revalidatePath('/admin/products');
  revalidatePath('/admin/products/top10');
  revalidatePath('/products');
  revalidatePath('/');
}

function parseIdList(raw: string): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}
