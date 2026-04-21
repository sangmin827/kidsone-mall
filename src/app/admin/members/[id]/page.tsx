import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminMemberById } from "@/src/server/members";
import { updateAdminMemberMetaAction } from "@/src/app/admin/members/actions";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:    { label: "활성",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive:  { label: "비활성", cls: "bg-[#FAF9F6]  text-[#6b7280]  border-gray-200"   },
  blocked:   { label: "차단",   cls: "bg-red-50     text-[#FF5555]  border-red-200"     },
  withdrawn: { label: "탈퇴",   cls: "bg-gray-50    text-gray-400   border-gray-200"    },
};

const GRADE_CONFIG: Record<string, { label: string; cls: string }> = {
  normal: { label: "일반", cls: "bg-[#FAF9F6] text-[#6b7280]  border-gray-200"   },
  vip:    { label: "VIP",  cls: "bg-[#ede9fb] text-[#5332C9] border-[#c4b5fd]" },
  black:  { label: "블랙", cls: "bg-gray-900  text-white      border-gray-700"   },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "입금 대기", paid: "결제 완료", preparing: "상품 준비중",
  shipping: "배송 중",  delivered: "배송 완료", cancelled: "주문 취소",
};
const ORDER_STATUS_CLS: Record<string, string> = {
  pending:   "bg-amber-50  text-amber-700  border-amber-200",
  paid:      "bg-green-50  text-green-700  border-green-200",
  preparing: "bg-blue-50   text-blue-700   border-blue-200",
  shipping:  "bg-[#ede9fb] text-[#5332C9] border-[#c4b5fd]",
  delivered: "bg-[#FAF9F6] text-[#6b7280] border-gray-200",
  cancelled: "bg-red-50    text-[#FF5555]  border-red-200",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function formatDateShort(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short" }).format(new Date(value));
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="w-24 shrink-0 text-[#9ca3af]">{label}</span>
      <span className="font-medium text-[#222222]">{value ?? "-"}</span>
    </div>
  );
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getAdminMemberById(id);
  if (!member) notFound();

  const statusCfg = STATUS_CONFIG[member.admin_meta.status] ?? STATUS_CONFIG.active;
  const gradeCfg  = GRADE_CONFIG[member.admin_meta.grade]  ?? GRADE_CONFIG.normal;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <Link
          href="/admin/members"
          className="mb-2 inline-flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#5332C9]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          회원 목록으로
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#222222] sm:text-2xl">
              {member.profile.name ?? "(이름 없음)"}
            </h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">{member.profile.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.cls}`}>
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${gradeCfg.cls}`}>
              {gradeCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* 주문 요약 카드들 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-4 text-center">
          <p className="text-xl font-bold text-[#222222]">{member.order_summary.order_count}</p>
          <p className="mt-0.5 text-xs text-[#9ca3af]">총 주문</p>
        </div>
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-4 text-center">
          <p className="text-xl font-bold text-[#222222]">
            {member.order_summary.total_order_amount.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-[#9ca3af]">총 주문금액(원)</p>
        </div>
        <div className="rounded-2xl border border-[#E8E6E1] bg-white p-4 text-center">
          <p className="text-xl font-bold text-[#222222]">{member.addresses.length}</p>
          <p className="mt-0.5 text-xs text-[#9ca3af]">배송지 수</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* 왼쪽 */}
        <div className="space-y-5">
          {/* 기본 정보 */}
          <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#222222]">기본 정보</h2>
            <InfoRow label="이름" value={member.profile.name} />
            <InfoRow label="이메일" value={member.profile.email} />
            <InfoRow label="연락처" value={member.profile.phone} />
            <InfoRow label="로그인" value={
              member.profile.provider ? (
                <span className="inline-flex items-center rounded-full bg-[#FAF9F6] border border-[#E8E6E1] px-2 py-0.5 text-xs font-medium text-[#6b7280]">
                  {member.profile.provider}
                </span>
              ) : "-"
            }/>
            <InfoRow label="권한" value={
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${member.profile.role === "admin" ? "bg-[#ede9fb] text-[#5332C9] border-[#c4b5fd]" : "bg-[#FAF9F6] text-[#6b7280] border-gray-200"}`}>
                {member.profile.role === "admin" ? "관리자" : "일반 회원"}
              </span>
            }/>
            <InfoRow label="가입일" value={formatDate(member.profile.created_at)} />
            <InfoRow label="최근 로그인" value={formatDate(member.profile.last_login_at)} />
          </section>

          {/* 배송지 목록 */}
          <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-[#222222]">배송지 목록</h2>
            {member.addresses.length === 0 ? (
              <p className="text-sm text-[#9ca3af]">등록된 배송지가 없습니다.</p>
            ) : (
              <div className="space-y-2.5">
                {member.addresses.map((addr) => (
                  <div key={addr.id} className="rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#222222]">{addr.recipient_name}</span>
                      <span className="text-xs text-[#9ca3af]">{addr.recipient_phone}</span>
                      {addr.is_default && (
                        <span className="rounded-full bg-[#ede9fb] px-2 py-0.5 text-[10px] font-semibold text-[#5332C9]">
                          기본
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      ({addr.postal_code ?? "-"}) {addr.address_main} {addr.address_detail ?? ""}
                    </p>
                    {addr.memo && (
                      <p className="mt-0.5 text-xs text-[#9ca3af]">메모: {addr.memo}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 최근 주문 */}
          <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-[#222222]">최근 주문</h2>
            {member.recent_orders.length === 0 ? (
              <p className="text-sm text-[#9ca3af]">주문 내역이 없습니다.</p>
            ) : (
              <>
                {/* 모바일 카드 */}
                <div className="space-y-2 lg:hidden">
                  {member.recent_orders.map((order) => {
                    const cls = ORDER_STATUS_CLS[order.status] ?? "bg-[#FAF9F6] text-[#6b7280] border-gray-200";
                    const lbl = ORDER_STATUS_LABELS[order.status] ?? order.status;
                    return (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3 text-sm hover:bg-[#ede9fb]/30 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#222222]">{order.order_number}</p>
                          <p className="text-[11px] text-[#9ca3af]">{formatDateShort(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{lbl}</span>
                          <span className="text-xs font-bold text-[#222222]">{order.total_amount.toLocaleString()}원</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {/* PC 테이블 */}
                <div className="hidden overflow-hidden rounded-xl border border-[#E8E6E1] lg:block">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-[#FAF9F6] text-left">
                        <th className="px-4 py-2.5 text-xs font-semibold text-[#6b7280]">주문번호</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-[#6b7280]">상태</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-[#6b7280]">금액</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-[#6b7280]">주문일</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-[#6b7280]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.recent_orders.map((order) => {
                        const cls = ORDER_STATUS_CLS[order.status] ?? "bg-[#FAF9F6] text-[#6b7280] border-gray-200";
                        const lbl = ORDER_STATUS_LABELS[order.status] ?? order.status;
                        return (
                          <tr key={order.id} className="border-b last:border-b-0 hover:bg-[#FAF9F6]/50 transition-colors">
                            <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#222222]">
                              {order.order_number}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{lbl}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-[#222222]">
                              {order.total_amount.toLocaleString()}원
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-[#9ca3af]">
                              {formatDateShort(order.created_at)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="text-xs font-medium text-[#5332C9] hover:underline"
                              >
                                상세보기
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>

        {/* 오른쪽: 관리자 전용 */}
        <aside className="h-fit rounded-2xl border border-[#E8E6E1] bg-white p-5 lg:sticky lg:top-6">
          <h2 className="mb-4 text-sm font-bold text-[#222222]">관리자 전용 설정</h2>

          <form action={updateAdminMemberMetaAction} className="space-y-4">
            <input type="hidden" name="userId" value={member.profile.id} />

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">회원 상태</label>
              <select
                name="status"
                defaultValue={member.admin_meta.status}
                className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-1 focus:ring-[#5332C9]"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="blocked">차단</option>
                <option value="withdrawn">탈퇴</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">회원 등급</label>
              <select
                name="grade"
                defaultValue={member.admin_meta.grade}
                className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-1 focus:ring-[#5332C9]"
              >
                <option value="normal">일반</option>
                <option value="vip">VIP</option>
                <option value="black">블랙</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">관리자 메모</label>
              {member.admin_meta.memo && (
                <div className="mb-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs text-amber-800">{member.admin_meta.memo}</p>
                </div>
              )}
              <textarea
                name="memo"
                defaultValue={member.admin_meta.memo ?? ""}
                rows={4}
                placeholder="관리자만 볼 수 있는 내부 메모"
                className="w-full resize-none rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:border-[#5332C9] focus:outline-none focus:ring-1 focus:ring-[#5332C9]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#5332C9] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4427b0]"
            >
              저장
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
