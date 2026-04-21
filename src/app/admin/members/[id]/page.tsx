import { notFound } from "next/navigation";
import { getAdminMemberById } from "@/src/server/members";
import { updateAdminMemberMetaAction } from "@/src/app/admin/members/actions";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getAdminMemberById(id);

  if (!member) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">회원 상세</h1>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">이메일:</span>{" "}
              {member.profile.email}
            </p>
            <p>
              <span className="font-medium">이름:</span>{" "}
              {member.profile.name ?? "-"}
            </p>
            <p>
              <span className="font-medium">전화번호:</span>{" "}
              {member.profile.phone ?? "-"}
            </p>
            <p>
              <span className="font-medium">권한:</span> {member.profile.role}
            </p>
            <p>
              <span className="font-medium">로그인 공급자:</span>{" "}
              {member.profile.provider ?? "-"}
            </p>
            <p>
              <span className="font-medium">가입일:</span>{" "}
              {formatDate(member.profile.created_at)}
            </p>
            <p>
              <span className="font-medium">최근 로그인:</span>{" "}
              {formatDate(member.profile.last_login_at)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">주문 요약</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">총 주문 수:</span>{" "}
              {member.order_summary.order_count}
            </p>
            <p>
              <span className="font-medium">총 주문 금액:</span>{" "}
              {formatPrice(member.order_summary.total_order_amount)}
            </p>
            <p>
              <span className="font-medium">최근 주문일:</span>{" "}
              {formatDate(member.order_summary.last_order_at)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-5">
        <h2 className="mb-4 text-lg font-semibold">관리자 전용 정보</h2>

        <form action={updateAdminMemberMetaAction} className="space-y-4">
          <input type="hidden" name="userId" value={member.profile.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">회원 상태</span>
              <select
                name="status"
                defaultValue={member.admin_meta.status}
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="blocked">blocked</option>
                <option value="withdrawn">withdrawn</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">회원 등급</span>
              <select
                name="grade"
                defaultValue={member.admin_meta.grade}
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="normal">normal</option>
                <option value="vip">vip</option>
                <option value="black">black</option>
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium">관리자 메모</span>
            <textarea
              name="memo"
              defaultValue={member.admin_meta.memo ?? ""}
              rows={6}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="관리자만 볼 수 있는 내부 메모"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-[#5332C9] px-4 py-2 text-white"
          >
            저장
          </button>
        </form>
      </section>

      <section className="rounded-2xl border p-5">
        <h2 className="mb-4 text-lg font-semibold">배송지 목록</h2>
        <div className="space-y-3">
          {member.addresses.length === 0 ? (
            <p className="text-sm text-[#6b7280]">등록된 배송지가 없습니다.</p>
          ) : (
            member.addresses.map((address) => (
              <div key={address.id} className="rounded-xl border p-4 text-sm">
                <p>
                  <span className="font-medium">{address.recipient_name}</span>
                  {" · "}
                  {address.recipient_phone}
                  {address.is_default ? " · 기본배송지" : ""}
                </p>
                <p className="mt-1">
                  ({address.postal_code ?? "-"}) {address.address_main}{" "}
                  {address.address_detail ?? ""}
                </p>
                <p className="mt-1 text-[#6b7280]">
                  메모: {address.memo ?? "-"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border p-5">
        <h2 className="mb-4 text-lg font-semibold">최근 주문</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-3 py-2">주문번호</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">금액</th>
                <th className="px-3 py-2">주문일</th>
              </tr>
            </thead>
            <tbody>
              {member.recent_orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-[#6b7280]"
                  >
                    주문 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                member.recent_orders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="px-3 py-2">{order.order_number}</td>
                    <td className="px-3 py-2">{order.status}</td>
                    <td className="px-3 py-2">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-3 py-2">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
