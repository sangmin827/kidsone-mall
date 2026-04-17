import Link from "next/link";
import { requireAdmin } from "@/src/server/admin-auth";
import {
  getAdminActivityLogs,
  type AdminActivityLog,
} from "@/src/server/admin-activity-logs";

const PAGE_SIZE = 50;

const ACTION_LABEL: Record<string, string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
  login: "로그인",
  status_change: "상태변경",
};

const ENTITY_LABEL: Record<string, string> = {
  product: "상품",
  category: "카테고리",
  order: "주문",
  member: "회원",
  member_meta: "회원 메모",
};

type Props = {
  searchParams: Promise<{
    page?: string;
    entity?: string;
    action?: string;
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
      second: "2-digit",
    });
  } catch {
    return value;
  }
}

function renderDataCell(data: unknown): string {
  if (data === null || data === undefined) return "-";
  if (typeof data === "string") return data;
  try {
    const str = JSON.stringify(data);
    return str.length > 80 ? `${str.slice(0, 80)}…` : str;
  } catch {
    return "-";
  }
}

export default async function AdminActivityLogsPage({ searchParams }: Props) {
  await requireAdmin();

  const { page, entity, action } = await searchParams;
  const currentPage = Math.max(1, Number(page ?? 1) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const { logs, total } = await getAdminActivityLogs({
    limit: PAGE_SIZE,
    offset,
    entityType: entity || undefined,
    action: action || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set("page", String(targetPage));
    if (entity) params.set("entity", entity);
    if (action) params.set("action", action);
    const qs = params.toString();
    return qs ? `/admin/activity-logs?${qs}` : "/admin/activity-logs";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">관리자 활동 로그</h1>
          <p className="mt-1 text-sm text-gray-500">
            상품/카테고리/주문/회원 관리 작업 내역을 시간순으로 확인합니다.
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
            엔티티
          </label>
          <select
            name="entity"
            defaultValue={entity ?? ""}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">전체</option>
            <option value="product">상품</option>
            <option value="category">카테고리</option>
            <option value="order">주문</option>
            <option value="member">회원</option>
            <option value="member_meta">회원 메모</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            액션
          </label>
          <select
            name="action"
            defaultValue={action ?? ""}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">전체</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
            <option value="status_change">상태변경</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          필터 적용
        </button>

        {(entity || action) && (
          <Link
            href="/admin/activity-logs"
            className="rounded-xl border px-3 py-2 text-sm text-gray-600"
          >
            초기화
          </Link>
        )}

        <p className="ml-auto text-sm text-gray-500">
          총 {total.toLocaleString()}건
        </p>
      </form>

      {/* 로그 목록 */}
      <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3">시각</th>
              <th className="px-4 py-3">관리자</th>
              <th className="px-4 py-3">엔티티</th>
              <th className="px-4 py-3">액션</th>
              <th className="px-4 py-3">대상 ID</th>
              <th className="px-4 py-3">설명</th>
              <th className="px-4 py-3">변경 내용</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  기록된 활동 로그가 없습니다.
                </td>
              </tr>
            ) : (
              logs.map((log: AdminActivityLog) => (
                <tr key={log.id} className="border-b align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <div className="font-medium">
                      {log.admin_name ?? log.admin_email ?? "-"}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {log.admin_user_id.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      {ENTITY_LABEL[log.entity_type] ?? log.entity_type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600">
                    {log.entity_id ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {log.description ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600">
                        펼치기
                      </summary>
                      <div className="mt-2 space-y-2">
                        {log.before_data !== null &&
                          log.before_data !== undefined && (
                            <div>
                              <div className="text-[11px] font-semibold text-gray-500">
                                BEFORE
                              </div>
                              <pre className="max-w-md overflow-x-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[11px]">
                                {renderDataCell(log.before_data)}
                              </pre>
                            </div>
                          )}
                        {log.after_data !== null &&
                          log.after_data !== undefined && (
                            <div>
                              <div className="text-[11px] font-semibold text-gray-500">
                                AFTER
                              </div>
                              <pre className="max-w-md overflow-x-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-[11px]">
                                {renderDataCell(log.after_data)}
                              </pre>
                            </div>
                          )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
