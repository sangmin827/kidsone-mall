import Link from "next/link";

const menuItems = [
  {
    title: "주문내역",
    description: "주문한 상품과 배송 상태를 확인할 수 있습니다.",
    href: "/mypage/orders",
  },
  {
    title: "장바구니",
    description: "장바구니에 담아둔 상품을 확인하고 수량을 변경할 수 있습니다.",
    href: "/mypage/cart",
  },
  {
    title: "회원정보 수정",
    description: "주문자 이름과 연락처를 수정할 수 있습니다.",
    href: "/mypage/profile",
  },
];

export default function MyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">마이페이지</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
            <p className="mt-2 text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
