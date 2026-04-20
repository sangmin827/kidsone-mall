import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#FAF9F6] px-6 py-20 text-center">
      <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#ede9fb]" />
        <span className="relative text-5xl" role="img" aria-label="상품 없음">🔍</span>
      </div>

      <div className="max-w-md space-y-3">
        <h1 className="font-gmarket text-2xl font-bold text-[#222222] sm:text-3xl">
          상품을 찾을 수 없어요
        </h1>
        <p className="text-sm leading-7 text-[#6b7280]">
          삭제되었거나 주소가 잘못되었을 수 있어요.<br />
          다른 상품을 둘러보세요!
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/products" className="btn-primary">
          전체 상품 보기
        </Link>
        <Link href="/" className="btn-ghost">
          홈으로
        </Link>
      </div>
    </main>
  );
}
