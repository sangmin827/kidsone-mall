import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-blue-300 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-700">
              New Collection
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl font-gmarket">
              아이들을 위한 놀이도구
              <br />
              항상 새로운 놀이도구!
            </h1>
            <p className="text-gray-700 md:text-lg">홍보하는 공간!</p>
            <div className="flex gap-4">
              <Link
                href="/products"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
              >
                상품 보러가기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-xs text-gray-500">
          <p>
            (주)키즈원 대표 : 서대웅 사업자등록번호 : ~~~ 통신판매업신고번호 :
            ~~~~ 기타 정보 ~~~~ TEL : 010-2459-0479 FAX : ~~~~ 주소 : 광주광역시
            광산구 상무대로419번길 30-2 넘버원체육교실&이벤트 <br />
            <br />© 2026 No.1KidsSports&Event|㈜KidsOne. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
