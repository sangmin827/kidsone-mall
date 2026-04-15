import Link from "next/link";
import { getAdminMembers } from "@/src/server/members";

type SearchParams = Promise<{
  search?: string;
  role?: "all" | "customer" | "admin";
  provider?: "all" | "google" | "kakao";
  status?: "all" | "active" | "inactive" | "blocked" | "withdrawn";
  grade?: "all" | "normal" | "vip" | "black";
  sort?: "created_at_desc" | "created_at_asc" | "name_asc" | "email_asc";
}>;

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

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const members = await getAdminMembers({
    search: params.search,
    role: params.role ?? "all",
    provider: params.provider ?? "all",
    status: params.status ?? "all",
    grade: params.grade ?? "all",
    sort: params.sort ?? "created_at_desc",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">회원 관리</h1>

      <form className="grid gap-3 rounded-2xl border p-4 md:grid-cols-6">
        <input
          type="text"
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="이름, 이메일, 전화번호 검색"
          className="rounded-xl border px-3 py-2 md:col-span-2"
        />

        <select
          name="role"
          defaultValue={params.role ?? "all"}
          className="rounded-xl border px-3 py-2"
        >
          <option value="all">전체 권한</option>
          <option value="customer">customer</option>
          <option value="admin">admin</option>
        </select>

        <select
          name="provider"
          defaultValue={params.provider ?? "all"}
          className="rounded-xl border px-3 py-2"
        >
          <option value="all">전체 로그인</option>
          <option value="google">google</option>
          <option value="kakao">kakao</option>
        </select>

        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="rounded-xl border px-3 py-2"
        >
          <option value="all">전체 상태</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="blocked">blocked</option>
          <option value="withdrawn">withdrawn</option>
        </select>

        <select
          name="grade"
          defaultValue={params.grade ?? "all"}
          className="rounded-xl border px-3 py-2"
        >
          <option value="all">전체 등급</option>
          <option value="normal">normal</option>
          <option value="vip">vip</option>
          <option value="black">black</option>
        </select>

        <select
          name="sort"
          defaultValue={params.sort ?? "created_at_desc"}
          className="rounded-xl border px-3 py-2"
        >
          <option value="created_at_desc">가입일 최신순</option>
          <option value="created_at_asc">가입일 오래된순</option>
          <option value="name_asc">이름순</option>
          <option value="email_asc">이메일순</option>
        </select>

        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-white md:col-span-6 md:w-fit"
        >
          검색
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">전화번호</th>
              <th className="px-4 py-3">로그인</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">등급</th>
              <th className="px-4 py-3">주문수</th>
              <th className="px-4 py-3">주문금액</th>
              <th className="px-4 py-3">배송지</th>
              <th className="px-4 py-3">가입일</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  조회된 회원이 없습니다.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-t">
                  <td className="px-4 py-3">{member.name ?? "-"}</td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">{member.phone ?? "-"}</td>
                  <td className="px-4 py-3">{member.provider ?? "-"}</td>
                  <td className="px-4 py-3">{member.status}</td>
                  <td className="px-4 py-3">{member.grade}</td>
                  <td className="px-4 py-3">{member.order_count}</td>
                  <td className="px-4 py-3">
                    {formatPrice(member.total_order_amount)}
                  </td>
                  <td className="px-4 py-3">{member.address_count}</td>
                  <td className="px-4 py-3">{formatDate(member.created_at)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="rounded-lg border px-3 py-2"
                    >
                      상세보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
