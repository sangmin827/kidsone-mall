import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#FAF9F6] px-6 py-20 text-center">
      {/* Illustration */}
      <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#ede9fb]" />
        <span className="relative text-6xl" role="img" aria-label="길을 잃은 공">⚽</span>
        {/* Decorative dots */}
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5555] text-xs font-bold text-white shadow">?</span>
      </div>

      <div className="max-w-md space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#5332C9]">404 — 페이지를 찾을 수 없어요</p>
        <h1 className="font-gmarket text-3xl font-bold text-[#222222] sm:text-4xl">
          길을 잃었나요?
        </h1>
        <p className="text-sm leading-7 text-[#6b7280]">
          요청하신 페이지가 없거나, 주소가 바뀌었을 수 있어요.<br />
          홈으로 돌아가서 다시 시작해 보세요!
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          홈으로 가기
        </Link>
        <Link href="/products" className="btn-ghost">
          상품 보러가기
        </Link>
      </div>

      {/* Fun message */}
      <p className="mt-12 text-xs text-[#9ca3af]">
        혹시 찾던 상품이 있으신가요? 상품 목록에서 검색해 보세요 🔍
      </p>
    </main>
  );
}
