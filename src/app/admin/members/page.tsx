import Link from "next/link";
import { getAdminMembers } from "@/src/server/members";
import AdminMembersMobileFilter from "@/src/components/admin/members/AdminMembersMobileFilter";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:    { label: "활성",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inactive:  { label: "비활성", cls: "bg-[#FAF9F6]  text-[#6b7280]  border-gray-200"   },
  blocked:   { label: "차단",   cls: "bg-red-50     text-[#FF5555]  border-red-200"     },
  withdrawn: { label: "탈퇴",   cls: "bg-gray-50    text-gray-400   border-gray-200"    },
};

const GRADE_CONFIG: Record<string, { label: string; cls: string }> = {
  normal: { label: "일반", cls: "bg-[#FAF9F6] text-[#6b7280]  border-gray-200"    },
  vip:    { label: "VIP",  cls: "bg-[#ede9fb] text-[#5332C9] border-[#c4b5fd]"  },
  black:  { label: "블랙", cls: "bg-gray-900  text-white      border-gray-700"    },
};

const PROVIDER_ICON: Record<string, string> = {
  google: "G",
  kakao:  "K",
};

type SearchParams = Promise<{
  search?: string;
  role?: string;
  provider?: string;
  status?: string;
  grade?: string;
  sort?: string;
}>;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short" }).format(new Date(value));
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const members = await getAdminMembers({
    search: params.search,
    role: (params.role ?? "all") as "all" | "customer" | "admin",
    provider: (params.provider ?? "all") as "all" | "google" | "kakao",
    status: (params.status ?? "all") as "all" | "active" | "inactive" | "blocked" | "withdrawn",
    grade: (params.grade ?? "all") as "all" | "normal" | "vip" | "black",
    sort: (params.sort ?? "created_at_desc") as "created_at_desc" | "created_at_asc" | "name_asc" | "email_asc",
  });

  const hasFilter = !!(
    params.search ||
    (params.role && params.role !== "all") ||
    (params.provider && params.provider !== "all") ||
    (params.status && params.status !== "all") ||
    (params.grade && params.grade !== "all")
  );

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#222222] sm:text-2xl">회원 관리</h1>
          <p className="mt-0.5 text-sm text-[#6b7280]">
            총 <span className="font-semibold text-[#222222]">{members.length}</span>명
            {hasFilter && <span className="ml-1 text-[#5332C9]">(필터 적용됨)</span>}
          </p>
        </div>
      </div>

      {/* 모바일 필터 */}
      <AdminMembersMobileFilter
        search={params.search}
        role={params.role}
        provider={params.provider}
        status={params.status}
        grade={params.grade}
        sort={params.sort}
      />

      {/* 데스크탑 검색 / 필터 폼 */}
      <form
        method="get"
        className="hidden md:block rounded-2xl border border-[#E8E6E1] bg-white p-4 space-y-3"
      >
        {/* 검색어 */}
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="이름 · 이메일 · 전화번호 검색"
            className="flex-1 rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#5332C9] px-4 py-2 text-sm font-medium text-white hover:bg-[#4427b0] transition-colors"
          >
            검색
          </button>
          {hasFilter && (
            <Link
              href="/admin/members"
              className="rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm text-[#6b7280] hover:bg-[#FAF9F6] transition-colors"
            >
              초기화
            </Link>
          )}
        </div>

        {/* 필터 셀렉트들 */}
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">상태</label>
            <select name="status" defaultValue={params.status ?? "all"} className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="blocked">차단</option>
              <option value="withdrawn">탈퇴</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">등급</label>
            <select name="grade" defaultValue={params.grade ?? "all"} className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
              <option value="all">전체 등급</option>
              <option value="normal">일반</option>
              <option value="vip">VIP</option>
              <option value="black">블랙</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">로그인</label>
            <select name="provider" defaultValue={params.provider ?? "all"} className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
              <option value="all">전체</option>
              <option value="google">Google</option>
              <option value="kakao">Kakao</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">권한</label>
            <select name="role" defaultValue={params.role ?? "all"} className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
              <option value="all">전체 권한</option>
              <option value="customer">일반 회원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[#9ca3af]">정렬</label>
            <select name="sort" defaultValue={params.sort ?? "created_at_desc"} className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
              <option value="created_at_desc">가입일 최신순</option>
              <option value="created_at_asc">가입일 오래된순</option>
              <option value="name_asc">이름순</option>
              <option value="email_asc">이메일순</option>
            </select>
          </div>
        </div>
      </form>

      {/* 빈 상태 */}
      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[#E8E6E1] bg-white py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6] text-3xl">👤</div>
          <div>
            <p className="font-semibold text-[#222222]">
              {hasFilter ? "검색 결과가 없습니다" : "회원이 없습니다"}
            </p>
            <p className="mt-1 text-sm text-[#6b7280]">
              {hasFilter ? "검색 조건을 변경해 보세요." : "가입한 회원이 표시됩니다."}
            </p>
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E8E6E1] bg-white">

          {/* ── 모바일 카드 뷰 (md 미만) ── */}
          <div className="divide-y divide-[#E8E6E1] md:hidden">
            {members.map((member) => {
              const statusCfg = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.active;
              const gradeCfg  = GRADE_CONFIG[member.grade]  ?? GRADE_CONFIG.normal;
              return (
                <Link
                  key={member.id}
                  href={`/admin/members/${member.id}`}
                  className="block px-4 py-3.5 transition-colors hover:bg-[#FAF9F6]"
                >
                  {/* 행 1: 이름 + 배지들 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#222222]">
                      {member.name ?? "(이름 없음)"}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${gradeCfg.cls}`}>
                      {gradeCfg.label}
                    </span>
                    <span className="ml-auto text-[11px] text-[#9ca3af]">
                      {member.provider ? (PROVIDER_ICON[member.provider] ?? member.provider) : "-"}
                    </span>
                  </div>
                  {/* 행 2: 이메일 */}
                  <p className="mt-0.5 truncate text-xs text-[#6b7280]">{member.email}</p>
                  {/* 행 3: 연락처 + 가입일 */}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-[#9ca3af]">{member.phone ?? "연락처 없음"}</span>
                    <span className="text-[11px] text-[#9ca3af]">
                      주문 {member.order_count}건 · {formatDate(member.created_at)} 가입
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── PC 테이블 뷰 (md 이상) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-[#FAF9F6] text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">이름 / 이메일</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">연락처</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">로그인</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">상태</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">등급</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">주문</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]">가입일</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#6b7280]"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const statusCfg = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.active;
                  const gradeCfg  = GRADE_CONFIG[member.grade]  ?? GRADE_CONFIG.normal;
                  return (
                    <tr key={member.id} className="border-b last:border-b-0 hover:bg-[#FAF9F6]/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#222222]">{member.name ?? "(이름 없음)"}</p>
                        <p className="text-xs text-[#9ca3af] truncate max-w-[200px]">{member.email}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6b7280]">
                        {member.phone ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {member.provider ? (
                          <span className="inline-flex items-center rounded-full bg-[#FAF9F6] border border-[#E8E6E1] px-2 py-0.5 text-xs font-medium text-[#6b7280]">
                            {member.provider}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${gradeCfg.cls}`}>
                          {gradeCfg.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs">
                        <p className="font-semibold text-[#222222]">{member.order_count}건</p>
                        <p className="text-[#9ca3af]">{member.total_order_amount.toLocaleString()}원</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6b7280]">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/members/${member.id}`}
                          className="inline-flex items-center rounded-xl border border-[#E8E6E1] px-3 py-1.5 text-xs font-medium text-[#222222] hover:bg-[#FAF9F6] transition-colors"
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
        </div>
      )}
    </div>
  );
}
