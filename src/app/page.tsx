import Link from "next/link";
import Footer from "../components/layout/Footer";

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
    </main>
  );
}
