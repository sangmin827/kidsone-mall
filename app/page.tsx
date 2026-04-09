import Link from "next/link";

const products = [
  {
    id: 1,
    name: "베이직 반팔 티셔츠",
    price: "19,900원",
    image: "https://via.placeholder.com/400x400?text=Product+1",
  },
  {
    id: 2,
    name: "오버핏 후드집업",
    price: "49,900원",
    image: "https://via.placeholder.com/400x400?text=Product+2",
  },
  {
    id: 3,
    name: "데님 팬츠",
    price: "39,900원",
    image: "https://via.placeholder.com/400x400?text=Product+3",
  },
  {
    id: 4,
    name: "미니 크로스백",
    price: "29,900원",
    image: "https://via.placeholder.com/400x400?text=Product+4",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* 메인 배너 */}
      <section className="bg-gray-300 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
              New Collection
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl font-gmarket">
              아이들을 위한 놀이도구
              <br />
              항상 새로운 놀이도구!
            </h1>
            <p className="text-base text-gray-300 md:text-lg">
              트렌디한 아이템과 깔끔한 쇼핑 환경을 한 곳에서 만나보세요.
            </p>
            <div className="flex gap-4">
              <Link
                href="#products"
                className="rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200"
              >
                상품 보러가기
              </Link>
              <Link
                href="#categories"
                className="rounded-lg border border-white px-6 py-3 font-semibold text-white transition hover:bg-white hover:text-black"
              >
                카테고리 보기
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
