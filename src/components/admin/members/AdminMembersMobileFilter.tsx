"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Props = {
  search?: string;
  role?: string;
  provider?: string;
  status?: string;
  grade?: string;
  sort?: string;
};

const ROLE_LABELS: Record<string, string> = {
  all: "전체 권한", customer: "일반 회원", admin: "관리자",
};
const STATUS_LABELS: Record<string, string> = {
  all: "전체 상태", active: "활성", inactive: "비활성", blocked: "차단", withdrawn: "탈퇴",
};
const GRADE_LABELS: Record<string, string> = {
  all: "전체 등급", normal: "일반", vip: "VIP", black: "블랙",
};
const SORT_OPTIONS = [
  { value: "created_at_desc", label: "가입일 최신순" },
  { value: "created_at_asc",  label: "가입일 오래된순" },
  { value: "name_asc",        label: "이름순" },
  { value: "email_asc",       label: "이메일순" },
];

export default function AdminMembersMobileFilter({
  search, role, provider, status, grade, sort,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(isOpen));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const hasFilter = !!(
    search ||
    (role && role !== "all") ||
    (provider && provider !== "all") ||
    (status && status !== "all") ||
    (grade && grade !== "all")
  );

  const tags: string[] = [];
  if (search) tags.push(`"${search}"`);
  if (role && role !== "all") tags.push(ROLE_LABELS[role] ?? role);
  if (status && status !== "all") tags.push(STATUS_LABELS[status] ?? status);
  if (grade && grade !== "all") tags.push(GRADE_LABELS[grade] ?? grade);
  if (provider && provider !== "all") tags.push(provider);

  const validSort = SORT_OPTIONS.some((o) => o.value === sort) ? sort : "created_at_desc";

  return (
    <>
      {/* 활성 필터 요약 바 */}
      {hasFilter && (
        <div className="md:hidden flex items-center gap-2 rounded-xl border border-[#5332C9]/30 bg-[#ede9fb] px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5332C9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="flex-1 truncate text-xs font-medium text-[#5332C9]">
            {tags.join(" · ")}
          </span>
          <Link
            href="/admin/members"
            className="shrink-0 rounded-full bg-[#5332C9]/10 px-2 py-0.5 text-[11px] font-semibold text-[#5332C9] hover:bg-[#5332C9]/20"
          >
            초기화
          </Link>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`md:hidden fixed bottom-6 right-5 z-[150] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors bg-[#5332C9] text-white ${hasFilter ? "ring-4 ring-[#5332C9]/20" : ""}`}
        aria-label="검색 / 필터 열기"
      >
        {hasFilter ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
        {hasFilter && (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#FF5555] ring-2 ring-white"/>
        )}
      </button>

      {/* 바텀 시트 */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex flex-col justify-end">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
            onClick={() => setIsOpen(false)}
          />
          <div className={`relative rounded-t-3xl bg-white px-5 pt-4 pb-10 transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E8E6E1]"/>

            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#222222]">검색 / 필터</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF9F6] text-[#6b7280]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form method="get" action="/admin/members" className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">검색어</label>
                <input
                  type="text"
                  name="search"
                  defaultValue={search ?? ""}
                  placeholder="이름 · 이메일 · 전화번호"
                  className="w-full rounded-xl border border-[#E8E6E1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">상태</label>
                  <select name="status" defaultValue={status ?? "all"} className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
                    <option value="all">전체</option>
                    <option value="active">활성</option>
                    <option value="inactive">비활성</option>
                    <option value="blocked">차단</option>
                    <option value="withdrawn">탈퇴</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">등급</label>
                  <select name="grade" defaultValue={grade ?? "all"} className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
                    <option value="all">전체</option>
                    <option value="normal">일반</option>
                    <option value="vip">VIP</option>
                    <option value="black">블랙</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">로그인</label>
                  <select name="provider" defaultValue={provider ?? "all"} className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
                    <option value="all">전체</option>
                    <option value="google">Google</option>
                    <option value="kakao">Kakao</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">권한</label>
                  <select name="role" defaultValue={role ?? "all"} className="w-full rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5332C9]/30">
                    <option value="all">전체</option>
                    <option value="customer">일반 회원</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">정렬</label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8E6E1] px-3 py-2 text-sm has-[:checked]:border-[#5332C9] has-[:checked]:bg-[#ede9fb] has-[:checked]:text-[#5332C9]">
                      <input type="radio" name="sort" value={opt.value} defaultChecked={validSort === opt.value} className="hidden"/>
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Link
                  href="/admin/members"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-xl border border-[#E8E6E1] py-3 text-center text-sm font-medium text-[#6b7280]"
                >
                  초기화
                </Link>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#5332C9] py-3 text-sm font-semibold text-white hover:bg-[#4427b0] transition-colors"
                >
                  검색 적용
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
