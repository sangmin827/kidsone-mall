import Link from "next/link";
import { requireAdmin } from "@/src/server/admin-auth";
import {
  getPurchaseRequests,
  updatePurchaseRequest,
  type PurchaseRequest,
} from "@/src/server/purchase-requests";

const PAGE_SIZE = 50;

const STATUS_LABEL: Record<PurchaseRequest["status"], string> = {
  pending: "대기 (안내 전)",
  contacted: "안내 완료",
  closed: "종료",
};

const STATUS_COLOR: Record<PurchaseRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  contacted: "bg-emerald-50 text-emerald-700",
  closed: "bg-[#FAF9F6] text-[#6b7280]",
};

type Props = {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
};

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default async function AdminPurchaseRequestsPage({
  searchParams,
}: Props) {
  await requireAdmin();

  const { page, status } = await searchParams;

  const validStatus =
    status === "pending" || status === "contacted" || status === "closed"
      ? status
      : undefined;

  const currentPage = Math.max(1, Number(page ?? 1) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { requests, total } = await getPurchaseRequests({
    limit: PAGE_SIZE,
    offset,
    status: validStatus,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set("page", String(targetPage));
    if (validStatus) params.set("status", validStatus);
    const qs = params.toString();
    return qs
      ? `/admin/purchase-requests?${qs}`
      : "/admin/purchase-requests";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">구매 희망 요청</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          품절 상품에 대해 고객이 남긴 재입고 안내 신청 목록입니다.
        </p>
      </div>

      {/* 필터 */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#E8E6E1] bg-white p-4"
      >
        <div className="flex flex-wrap items-end gap-3 flex-1">
          <div>
            <label className="mb-1 block text-xs font-medium text-[#6b7280]">
              상태
            </label>
            <select
              name="status"
              defaultValue={validStatus ?? ""}
              className="rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
            >
              <option value="">전체</option>
              <option value="pending">대기</option>
              <option value="contacted">안내 완료</option>
              <option value="closed">종료</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-[#5332C9] px-4 py-2 text-sm font-medium text-white hover:bg-[#4427b0] transition-colors"
            >
              필터 적용
            </button>

            {validStatus && (
              <Link
                href="/admin/purchase-requests"
                className="rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm text-[#6b7280] hover:bg-[#FAF9F6] transition-colors"
              >
                초기화
              </Link>
            )}
          </div>
        </div>

        <p className="shrink-0 text-sm text-[#6b7280]">
          총 <span className="font-semibold text-[#222222]">{total.toLocaleString()}</span>건
        </p>
      </form>

      {/* 목록 */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-[#E8E6E1] bg-white p-12 text-center">
            <svg className="mx-auto mb-3 text-[#E8E6E1]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V22H4V12"/>
              <path d="M22 7H2v5h20V7z"/>
              <path d="M12 22V7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <p className="text-sm font-medium text-[#6b7280]">접수된 구매 희망 요청이 없습니다.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-[#E8E6E1] bg-white overflow-hidden"
            >
              {/* 카드 헤더 */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[req.status]}`}
                >
                  {STATUS_LABEL[req.status]}
                </span>
                <p className="text-sm font-semibold text-[#222222] truncate max-w-[200px] sm:max-w-none">
                  {req.product_name ?? `상품 #${req.product_id}`}
                </p>
                <Link
                  href={`/admin/products/${req.product_id}`}
                  className="text-xs font-medium text-[#5332C9] hover:underline"
                >
                  상품 보기 →
                </Link>
                <p className="ml-auto text-xs text-[#9ca3af] shrink-0">
                  {formatDateTime(req.created_at)}
                </p>
              </div>

              {/* 카드 본문 */}
              <div className="p-4 space-y-4">
                {/* 고객 정보 */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-[#FAF9F6] px-3 py-2.5">
                    <p className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wide">고객명</p>
                    <p className="mt-0.5 text-sm font-semibold text-[#222222]">{req.customer_name}</p>
                  </div>
                  <div className="rounded-xl bg-[#FAF9F6] px-3 py-2.5 col-span-1 sm:col-span-2">
                    <p className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wide">연락처</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      <a
                        href={`tel:${req.customer_phone}`}
                        className="text-[#5332C9] hover:underline"
                      >
                        {req.customer_phone}
                      </a>
                    </p>
                  </div>
                  {req.admin_memo && (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">메모</p>
                      <p className="mt-0.5 text-xs text-amber-800">{req.admin_memo}</p>
                    </div>
                  )}
                </div>

                {/* 상태 업데이트 폼 */}
                <form
                  action={updatePurchaseRequest}
                  className="flex flex-wrap items-end gap-2 border-t border-[#E8E6E1] pt-3"
                >
                  <input type="hidden" name="id" value={req.id} />

                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-[#6b7280]">
                      상태 변경
                    </label>
                    <select
                      name="status"
                      defaultValue={req.status}
                      className="rounded-lg border border-[#E8E6E1] bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
                    >
                      <option value="pending">대기 (안내 전)</option>
                      <option value="contacted">안내 완료</option>
                      <option value="closed">종료</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[160px] sm:min-w-[240px]">
                    <label className="mb-1 block text-[11px] font-medium text-[#6b7280]">
                      관리자 메모
                    </label>
                    <input
                      type="text"
                      name="admin_memo"
                      defaultValue={req.admin_memo ?? ""}
                      placeholder="예: 1/15 카톡으로 안내함"
                      className="w-full rounded-lg border border-[#E8E6E1] px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
                    />
                  </div>

                  <button
                    type="submit"
                    className="rounded-lg bg-[#5332C9] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4427b0] transition-colors"
                  >
                    저장
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {currentPage > 1 ? (
            <Link
              href={buildPageHref(currentPage - 1)}
              className="rounded-lg border px-3 py-1 text-sm"
            >
              ← 이전
            </Link>
          ) : (
            <span className="rounded-lg border px-3 py-1 text-sm text-[#9ca3af]">
              ← 이전
            </span>
          )}
          <span className="text-sm text-[#6b7280]">
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={buildPageHref(currentPage + 1)}
              className="rounded-lg border px-3 py-1 text-sm"
            >
              다음 →
            </Link>
          ) : (
            <span className="rounded-lg border px-3 py-1 text-sm text-[#9ca3af]">
              다음 →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
