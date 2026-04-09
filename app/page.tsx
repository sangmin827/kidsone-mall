import Link from "next/link";

const categories = [
  { name: "신상품", href: "#" },
  { name: "베스트", href: "#" },
  { name: "아우터", href: "#" },
  { name: "상의", href: "#" },
  { name: "하의", href: "#" },
  { name: "액세서리", href: "#" },
];

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
      <section className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
              New Collection
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              감각적인 스타일을 위한
              <br />
              새로운 쇼핑 경험
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

      {/* 카테고리 */}
      <section id="categories" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">카테고리</h2>
          <p className="mt-2 text-sm text-gray-500">
            원하는 상품군을 빠르게 찾아보세요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center font-medium shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 추천 상품 */}
      <section id="products" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">추천 상품</h2>
          <p className="mt-2 text-sm text-gray-500">
            지금 가장 많이 찾는 인기 상품입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-2 p-4">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-500">깔끔한 데일리 스타일</p>
                <p className="text-base font-bold">{product.price}</p>

                <button className="mt-2 w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800">
                  장바구니 담기
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-500">
          <p>© 2026 My Shop. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
