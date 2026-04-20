"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "new", label: "최신 등록순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "name_asc", label: "상품명 가나다순" },
  { value: "name_desc", label: "상품명 역순" },
];

export default function ProductsToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") ?? "new";
  const currentView = searchParams.get("view") ?? "";
  const currentQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(currentQuery);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingSort, setPendingSort] = useState(currentSort);

  // URL 변경 시 상태 동기화
  useEffect(() => { setQuery(currentQuery); }, [currentQuery]);
  useEffect(() => { setPendingSort(currentSort); }, [currentSort]);

  // 바텀시트 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  const buildUrl = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    });
    const qs = params.toString();
    return qs ? `${pathname || "/products"}?${qs}` : pathname || "/products";
  };

  const pushUrl = (patch: Record<string, string | null>) => {
    startTransition(() => { router.push(buildUrl(patch)); });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    pushUrl({ q: query.trim() || null });
  };

  const handleApplySort = () => {
    pushUrl({ sort: pendingSort });
    setSheetOpen(false);
  };

  // 현재 정렬 라벨
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "최신 등록순";
  const hasFilter = !!currentQuery || (currentSort && currentSort !== "new");

  return (
    <>
      {/* ━━━ PC/Tablet 툴바 (md 이상) ━━━ */}
      <div className="mb-5 hidden md:flex items-center justify-between gap-4">
        {/* 검색 */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="상품명을 검색하세요"
              className="w-full rounded-xl border border-[#E8E6E1] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-[#5332C9] focus:ring-2 focus:ring-[#5332C9]/15" />
          </div>
          <button type="submit" disabled={isPending} className="flex-none rounded-xl bg-[#5332C9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4427b0] disabled:opacity-50 transition-colors">검색</button>
          {currentQuery && (
            <button type="button" onClick={() => { setQuery(""); pushUrl({ q: null }); }}
              className="flex-none rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm text-[#6b7280] hover:border-[#FF5555] hover:text-[#FF5555] transition-colors">✕</button>
          )}
        </form>

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          {currentView === "top10" ? (
            <span className="badge-top px-3 py-1.5">순위순 (고정)</span>
          ) : (
            <>
              <label className="text-sm text-[#6b7280]" htmlFor="sort-select">정렬</label>
              <select id="sort-select" value={currentSort} onChange={(e) => pushUrl({ sort: e.target.value })} disabled={isPending}
                className="rounded-xl border border-[#E8E6E1] bg-white px-3 py-2.5 text-sm outline-none transition-all focus:border-[#5332C9] disabled:bg-[#FAF9F6] disabled:text-[#9ca3af]">
                {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {/* ━━━ 모바일 툴바 (md 미만) ━━━ */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        {/* 모바일 검색창 */}
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-1.5">
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="상품 검색"
              className="w-full rounded-xl border border-[#E8E6E1] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:border-[#5332C9] focus:ring-2 focus:ring-[#5332C9]/15" />
          </div>
          {currentQuery && (
            <button type="button" onClick={() => { setQuery(""); pushUrl({ q: null }); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E6E1] bg-white text-sm text-[#9ca3af] active:bg-[#FAF9F6]">✕</button>
          )}
        </form>

        {/* 필터/정렬 버튼 → 바텀시트 열기 */}
        {currentView !== "top10" && (
          <button type="button" onClick={() => setSheetOpen(true)}
            className={`flex h-10 flex-none items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors active:scale-[0.97] ${
              hasFilter ? "border-[#5332C9] bg-[#ede9fb] text-[#5332C9]" : "border-[#E8E6E1] bg-white text-[#6b7280]"
            }`}
            aria-label="정렬 및 필터">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            {currentSortLabel}
          </button>
        )}
        {currentView === "top10" && (
          <span className="flex h-10 items-center rounded-xl bg-[#fff0f0] px-3 text-xs font-semibold text-[#FF5555]">🏆 순위순</span>
        )}
      </div>

      {/* ━━━ 바텀시트 오버레이 ━━━ */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white pb-safe md:hidden"
            role="dialog"
            aria-label="정렬 선택"
          >
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#E8E6E1]" />
            </div>

            <div className="px-5 pb-6 pt-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-[#222222]">정렬</h3>
                <button type="button" onClick={() => setSheetOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[#6b7280] hover:bg-[#FAF9F6]" aria-label="닫기">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* 정렬 옵션 리스트 */}
              <div className="space-y-1.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPendingSort(opt.value)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-sm font-medium transition-colors active:scale-[0.98] ${
                      pendingSort === opt.value
                        ? "border-[#5332C9] bg-[#ede9fb] text-[#5332C9]"
                        : "border-[#E8E6E1] bg-white text-[#222222] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    {opt.label}
                    {pendingSort === opt.value && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5332C9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
              </div>

              {/* 적용 버튼 */}
              <button
                type="button"
                onClick={handleApplySort}
                disabled={isPending}
                className="mt-5 w-full rounded-xl bg-[#FF5555] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#e84444] active:scale-[0.98] disabled:opacity-50"
              >
                적용하기
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
