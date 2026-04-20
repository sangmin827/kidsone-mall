"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── 아이콘 ────────────────────────────────────────────────────────────
function SearchIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function XCircleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────
//
// 역할: 헤더 전역 검색 — /products?q=... 으로 이동
// 렌더링:
//   - md 미만: 검색 아이콘 버튼 → 전체화면 오버레이 (md:hidden)
//   - md 이상: 인라인 검색 바 (hidden md:flex)
//
// 두 헤더 섹션(모바일/데스크톱)에 각각 배치해도 breakpoint별로 독립 동작함.
// ─────────────────────────────────────────────────────────────────────
export default function HeaderSearch() {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [query, setQuery] = useState("");
  const overlayInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 오버레이 열릴 때 body 스크롤 잠금 + 입력 포커스
  useEffect(() => {
    if (overlayOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => overlayInputRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [overlayOpen]);

  // ESC 키로 오버레이 닫기
  useEffect(() => {
    if (!overlayOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [overlayOpen]);

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    setQuery("");
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = query.trim();
      if (!q) return;
      router.push(`/products?q=${encodeURIComponent(q)}`);
      closeOverlay();
      desktopInputRef.current?.blur();
    },
    [query, router, closeOverlay],
  );

  // 데스크톱 검색 완료 후 query 초기화
  const handleDesktopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
    setQuery("");
  };

  return (
    <>
      {/* ━━━ 모바일: 아이콘 버튼 (md 미만만 보임) ━━━ */}
      <button
        type="button"
        onClick={() => setOverlayOpen(true)}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-[#444444] transition-colors hover:bg-[#F5F4F1] active:bg-[#ede9fb] md:hidden"
        aria-label="검색 열기"
      >
        <SearchIcon size={18} />
      </button>

      {/* ━━━ 모바일: 전체화면 검색 오버레이 (md 미만만 보임) ━━━ */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col bg-white transition-all duration-200 md:hidden ${
          overlayOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="검색"
        aria-hidden={!overlayOpen}
      >
        {/* 검색 입력 헤더 */}
        <div className="flex flex-none items-center gap-2 border-b border-[#E8E6E1] px-4 py-3">
          <SearchIcon size={16} className="flex-none text-[#9ca3af]" />
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex flex-1 items-center"
          >
            <input
              ref={overlayInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명을 검색하세요"
              className="w-full bg-transparent text-[15px] text-[#222222] outline-none placeholder:text-[#c4c4c4]"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </form>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex-none text-[#b0b0b0] transition-colors hover:text-[#6b7280]"
              aria-label="검색어 지우기"
            >
              <XCircleIcon size={17} />
            </button>
          )}
          <button
            type="button"
            onClick={closeOverlay}
            className="flex-none text-sm font-medium text-[#6b7280] transition-colors hover:text-[#222222] active:text-[#222222]"
          >
            취소
          </button>
        </div>

        {/* 검색 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {query.trim() ? (
            /* 검색어 있을 때 — 빠른 검색 실행 버튼 */
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-[#FAF9F6] active:bg-[#ede9fb]"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#ede9fb]">
                <SearchIcon size={15} className="text-[#5332C9]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#222222]">
                  {query}
                </p>
                <p className="text-xs text-[#9ca3af]">전체 상품에서 검색</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ) : (
            /* 검색어 없을 때 — 안내 메시지 */
            <div className="flex flex-col items-center gap-3 pt-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6] text-3xl">
                🔍
              </div>
              <div>
                <p className="text-sm font-semibold text-[#222222]">
                  어떤 상품을 찾고 있나요?
                </p>
                <p className="mt-1 text-xs text-[#9ca3af]">
                  상품명, 카테고리 등으로 검색할 수 있어요
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ━━━ 데스크톱: 인라인 검색 바 (md 이상만 보임) ━━━ */}
      <form
        onSubmit={handleDesktopSubmit}
        className="hidden items-center gap-2 rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2 transition-all focus-within:border-[#5332C9] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#5332C9]/10 md:flex"
        style={{ width: "clamp(140px, 12vw, 200px)" }}
      >
        <SearchIcon size={13} className="flex-none text-[#9ca3af]" />
        <input
          ref={desktopInputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="상품 검색"
          className="min-w-0 flex-1 bg-transparent text-sm text-[#222222] outline-none placeholder:text-[#9ca3af]"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex-none text-[#b0b0b0] transition-colors hover:text-[#6b7280]"
            aria-label="검색어 지우기"
          >
            <XCircleIcon size={13} />
          </button>
        )}
      </form>
    </>
  );
}
