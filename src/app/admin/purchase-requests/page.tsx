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
  closed: "bg-gray-100 text-gray-500",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">구매 희망 요청</h1>
          <p className="mt-1 text-sm text-gray-500">
            품절 상품에 대해 고객이 남긴 재입고 안내 신청 목록입니다.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border px-3 py-2 text-sm text-gray-600"
        >
          ← 관리자 홈
        </Link>
      </div>

      {/* 필터 */}
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl border bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            상태
          </label>
          <select
            name="status"
            defaultValue={validStatus ?? ""}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">전체</option>
            <option value="pending">대기</option>
            <option value="contacted">안내 완료</option>
            <option value="closed">종료</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          필터 적용
        </button>

        {validStatus && (
          <Link
            href="/admin/purchase-requests"
            className="rounded-xl border px-3 py-2 text-sm text-gray-600"
          >
            초기화
          </Link>
        )}

        <p className="ml-auto text-sm text-gray-500">
          총 {total.toLocaleString()}건
        </p>
      </form>

      {/* 목록 */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-400">
            접수된 구매 희망 요청이 없습니다.
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="space-y-3 rounded-2xl border bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[req.status]}`}
                >
                  {STATUS_LABEL[req.status]}
                </span>
                <p className="text-sm font-semibold text-gray-900">
                  {req.product_name ?? `상품 #${req.product_id}`}
                </p>
                <Link
                  href={`/admin/products/${req.product_id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  상품 페이지로
                </Link>
                <p className="ml-auto text-xs text-gray-400">
                  {formatDateTime(req.created_at)}
                </p>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-[11px] text-gray-500">고객명</p>
                  <p className="font-medium">{req.customer_name}</p>
                </div>
                <div className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-[11px] text-gray-500">연락처</p>
                  <p className="font-medium">
                    <a
                      href={`tel:${req.customer_phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {req.customer_phone}
                    </a>
                  </p>
                </div>
              </div>

              <form
                action={updatePurchaseRequest}
                className="flex flex-wrap items-end gap-2 border-t pt-3"
              >
                <input type="hidden" name="id" value={req.id} />

                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">
                    상태
                  </label>
                  <select
                    name="status"
                    defaultValue={req.status}
                    className="rounded-lg border px-2 py-1 text-xs"
                  >
                    <option value="pending">대기</option>
                    <option value="contacted">안내 완료</option>
                    <option value="closed">종료</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-[11px] text-gray-500">
                    관리자 메모
                  </label>
                  <input
                    type="text"
                    name="admin_memo"
                    defaultValue={req.admin_memo ?? ""}
                    placeholder="예: 1/15 카톡으로 안내함"
                    className="w-full rounded-lg border px-2 py-1 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  저장
                </button>
              </form>
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
            <span className="rounded-lg border px-3 py-1 text-sm text-gray-300">
              ← 이전
            </span>
          )}
          <span className="text-sm text-gray-600">
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
            <span className="rounded-lg border px-3 py-1 text-sm text-gray-300">
              다음 →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
