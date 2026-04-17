'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteProduct } from '@/src/server/admin-product-actions';

type Props = {
  productId: number;
  productName: string;
};

export default function DeleteProductButton({ productId, productName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (pending) return;

    const ok = confirm(
      `'${productName}' 상품을 삭제할까요?\n(이미 주문된 상품은 삭제할 수 없고, 판매중지로만 바꿀 수 있습니다.)`,
    );
    if (!ok) return;

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set('id', String(productId));
        await deleteProduct(fd);
        toast.success('상품이 삭제되었습니다.');
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '삭제에 실패했습니다.';
        toast.error(message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? '처리 중...' : '삭제'}
    </button>
  );
}
