"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "new", label: "신상품순" },
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

  // URL 이 바뀌면 입력값도 동기화
  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  const buildUrl = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    // 현재 경로를 유지 (/products, /categories/[slug] 어디에서든 그대로)
    const base = pathname || "/products";
    return qs ? `${base}?${qs}` : base;
  };

  const pushUrl = (patch: Record<string, string | null>) => {
    startTransition(() => {
      router.push(buildUrl(patch));
    });
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushUrl({ q: query.trim() || null });
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    pushUrl({ sort: event.target.value });
  };

  return (
    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form
        onSubmit={handleSearch}
        className="flex w-full max-w-md items-center gap-2"
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="상품명을 검색하세요"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          검색
        </button>
        {currentQuery && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              pushUrl({ q: null });
            }}
            className="shrink-0 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-600"
          >
            초기화
          </button>
        )}
      </form>

      <div className="flex items-center gap-3">
        {currentView === "top10" ? (
          // Top 10 페이지는 순위순이 본질. 해제 버튼 대신 고정 라벨만 노출.
          <span className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white">
            순위순 (고정)
          </span>
        ) : (
          <>
            <label className="text-sm text-gray-500">정렬</label>
            <select
              value={currentSort}
              onChange={handleSortChange}
              disabled={isPending}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
