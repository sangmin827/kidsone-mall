import Link from 'next/link';
import type { AdminProduct } from '@/src/server/admin-products';
import DeleteProductButton from '@/src/components/admin/products/DeleteProductButton';

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
            <th className="px-4 py-3">배지</th>
            <th className="px-4 py-3">수정</th>
            <th className="px-4 py-3">삭제</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
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
                  <div className="flex flex-wrap gap-1">
                    {product.is_new && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        신상품
                      </span>
                    )}
                    {product.top10_rank !== null && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        TOP {product.top10_rank}
                      </span>
                    )}
                    {product.is_sold_out && (
                      <span className="rounded-full bg-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-800">
                        품절{product.hide_when_sold_out ? '·숨김' : ''}
                      </span>
                    )}
                    {!product.is_new &&
                      product.top10_rank === null &&
                      !product.is_sold_out && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                  </div>
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
                  <DeleteProductButton
                    productId={product.id}
                    productName={product.name}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
