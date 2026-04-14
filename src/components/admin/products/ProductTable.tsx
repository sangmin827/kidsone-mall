import Link from 'next/link';
import type { AdminProduct } from '@/src/server/admin-products';
import { deleteProduct } from '@/src/server/admin-products';

type Props = {
  products: AdminProduct[];
};

export default function ProductTable({ products }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left">
            <th className="px-4 py-3">번호</th>
            <th className="px-4 py-3">상품명</th>
            <th className="px-4 py-3">슬러그</th>
            <th className="px-4 py-3">가격</th>
            <th className="px-4 py-3">재고</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">수정</th>
            <th className="px-4 py-3">삭제</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                등록된 상품이 없습니다.
              </td>
            </tr>
          ) : (
            products.map((product, index) => (
              <tr key={product.id} className="border-b">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3">{product.slug}</td>
                <td className="px-4 py-3">
                  {product.price.toLocaleString()}원
                </td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">
                  {product.is_active ? '판매중' : '숨김'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="rounded-lg border px-3 py-1 text-xs"
                  >
                    수정
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <button
                      type="submit"
                      className="rounded-lg border px-3 py-1 text-xs"
                    >
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
