import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyWishlists } from "@/src/server/wishlist";
import WishlistPageGrid from "@/src/components/product/WishlistPageGrid";

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const items = await getMyWishlists();

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="section-inner py-8">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/mypage"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[#E8E6E1] text-[#6b7280] hover:bg-[#FAF9F6]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#222222]">찜한 상품</h1>
            <p className="text-sm text-[#9ca3af]">총 {items.length}개</p>
          </div>
        </div>

        {/* 빈 상태 */}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[#E8E6E1] bg-white py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              🤍
            </div>
            <div>
              <p className="font-semibold text-[#222222]">아직 찜한 상품이 없어요</p>
              <p className="mt-1 text-sm text-[#6b7280]">마음에 드는 상품의 ♡ 버튼을 눌러 저장해 보세요.</p>
            </div>
            <Link
              href="/products"
              className="mt-2 rounded-xl bg-[#5332C9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#4427b0] transition-colors"
            >
              상품 보러 가기
            </Link>
          </div>
        )}

        {/* 상품 그리드 */}
        {items.length > 0 && <WishlistPageGrid initialItems={items} />}
      </div>
    </main>
  );
}
