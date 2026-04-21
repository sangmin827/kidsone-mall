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
      <div>
        <h1 className="text-2xl font-bold">관리자 활동 로그</h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          상품/카테고리/주문/회원 관리 작업 내역을 시간순으로 확인합니다.
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
              엔티티
            </label>
            <select
              name="entity"
              defaultValue={entity ?? ""}
              className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
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
            <label className="mb-1 block text-xs font-medium text-[#6b7280]">
              액션
            </label>
            <select
              name="action"
              defaultValue={action ?? ""}
              className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
            >
              <option value="">전체</option>
              <option value="create">생성</option>
              <option value="update">수정</option>
              <option value="delete">삭제</option>
              <option value="status_change">상태변경</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-[#5332C9] px-4 py-2 text-sm font-medium text-white hover:bg-[#4427b0] transition-colors"
            >
              필터 적용
            </button>

            {(entity || action) && (
              <Link
                href="/admin/activity-logs"
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

      {/* 로그 목록 — 모바일: 카드, PC: 테이블 */}
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-12 text-center">
          <svg className="mx-auto mb-3 text-[#E8E6E1]" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p className="text-sm font-medium text-[#6b7280]">기록된 활동 로그가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* 모바일 카드 뷰 (lg 미만) */}
          <div className="space-y-3 lg:hidden">
            {logs.map((log: AdminActivityLog) => (
              <div key={log.id} className="rounded-2xl border border-[#E8E6E1] bg-white overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[#E8E6E1] bg-[#FAF9F6] px-4 py-2.5">
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    {ENTITY_LABEL[log.entity_type] ?? log.entity_type}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                  <span className="ml-auto text-xs text-[#9ca3af]">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#222222]">
                      {log.admin_name ?? log.admin_email ?? "-"}
                    </p>
                    {log.entity_id && (
                      <p className="text-[11px] text-[#9ca3af]">ID: {log.entity_id}</p>
                    )}
                  </div>
                  {log.description && (
                    <p className="text-xs text-[#6b7280]">{log.description}</p>
                  )}
                  {(log.before_data !== null && log.before_data !== undefined) ||
                   (log.after_data !== null && log.after_data !== undefined) ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-[#5332C9] font-medium">변경 내용 보기</summary>
                      <div className="mt-2 space-y-2">
                        {log.before_data !== null && log.before_data !== undefined && (
                          <div>
                            <p className="text-[11px] font-semibold text-[#6b7280] mb-1">BEFORE</p>
                            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#FAF9F6] p-2 text-[11px]">
                              {renderDataCell(log.before_data)}
                            </pre>
                          </div>
                        )}
                        {log.after_data !== null && log.after_data !== undefined && (
                          <div>
                            <p className="text-[11px] font-semibold text-[#6b7280] mb-1">AFTER</p>
                            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#FAF9F6] p-2 text-[11px]">
                              {renderDataCell(log.after_data)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* PC 테이블 뷰 (lg 이상) */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-[#FAF9F6] text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">시각</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">관리자</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">엔티티</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">액션</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">대상 ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">설명</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">변경 내용</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: AdminActivityLog) => (
                  <tr key={log.id} className="border-b last:border-b-0 align-top hover:bg-[#FAF9F6]/50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6b7280]">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs">
                      <div className="font-medium text-[#222222]">
                        {log.admin_name ?? log.admin_email ?? "-"}
                      </div>
                      <div className="text-[11px] text-[#9ca3af]">
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
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6b7280]">
                      {log.entity_id ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#6b7280]">
                      {log.description ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-[#5332C9] font-medium hover:underline">
                          펼치기
                        </summary>
                        <div className="mt-2 space-y-2">
                          {log.before_data !== null &&
                            log.before_data !== undefined && (
                              <div>
                                <div className="text-[11px] font-semibold text-[#6b7280]">BEFORE</div>
                                <pre className="max-w-md overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#FAF9F6] p-2 text-[11px]">
                                  {renderDataCell(log.before_data)}
                                </pre>
                              </div>
                            )}
                          {log.after_data !== null &&
                            log.after_data !== undefined && (
                              <div>
                                <div className="text-[11px] font-semibold text-[#6b7280]">AFTER</div>
                                <pre className="max-w-md overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#FAF9F6] p-2 text-[11px]">
                                  {renderDataCell(log.after_data)}
                                </pre>
                              </div>
                            )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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
