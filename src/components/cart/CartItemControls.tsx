'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  increaseCartItemAction,
  removeCartItemAction,
  setCartItemQuantityAction,
} from '@/src/app/mypage/cart/actions';

type Props = {
  cartItemId: number;
  initialQuantity: number;
  stock: number;
  isSoldOut: boolean;
};

export default function CartItemControls({
  cartItemId,
  initialQuantity,
  stock,
  isSoldOut,
}: Props) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  const clampQuantity = (value: number) => {
    if (Number.isNaN(value)) return 1;
    if (value < 1) return 1;
    if (stock > 0 && value > stock) return stock;
    return value;
  };

  const handleDecrease = () => {
    if (quantity <= 1) return;

    const prev = quantity;
    const next = Math.max(1, prev - 1);
    setQuantity(next);
    setErrorMessage('');

    const formData = new FormData();
    formData.set('cartItemId', String(cartItemId));
    formData.set('quantity', String(next));

    startTransition(async () => {
      const result = await setCartItemQuantityAction(formData);
      if (!result.ok) {
        setQuantity(prev);
        setErrorMessage(result.message);
      }
    });
  };

  const handleIncrease = () => {
    if (isSoldOut || quantity >= stock) return;

    const prev = quantity;
    const next = Math.min(stock, prev + 1);
    setQuantity(next);
    setErrorMessage('');

    const formData = new FormData();
    formData.set('cartItemId', String(cartItemId));
    formData.set('currentQuantity', String(prev));

    startTransition(async () => {
      const result = await increaseCartItemAction(formData);
      if (!result.ok) {
        setQuantity(prev);
        setErrorMessage(result.message);
      }
    });
  };

  const handleInputChange = (value: string) => {
    if (value === '') {
      setQuantity(1);
      return;
    }
    setQuantity(clampQuantity(Number(value)));
  };

  const handleInputCommit = () => {
    const next = clampQuantity(quantity);
    setQuantity(next);
    setErrorMessage('');

    const formData = new FormData();
    formData.set('cartItemId', String(cartItemId));
    formData.set('quantity', String(next));

    startTransition(async () => {
      const result = await setCartItemQuantityAction(formData);
      if (!result.ok) {
        setErrorMessage(result.message);
      }
    });
  };

  const handleRemove = () => {
    setErrorMessage('');

    const formData = new FormData();
    formData.set('cartItemId', String(cartItemId));

    startTransition(async () => {
      const result = await removeCartItemAction(formData);
      if (!result.ok) {
        setErrorMessage(result.message);
      }
    });
  };

  return (
    <div className="mt-4 flex items-center justify-between border-t pt-4">
      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={isPending || quantity <= 1}
            className="h-9 w-9 rounded-lg border text-lg hover:bg-gray-50 disabled:opacity-50"
          >
            -
          </button>

          <input
            type="number"
            min={1}
            max={stock > 0 ? stock : 1}
            value={quantity}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            disabled={isPending}
            className="h-9 w-20 rounded-lg border text-center text-sm font-semibold outline-none"
          />

          <button
            type="button"
            onClick={handleIncrease}
            disabled={isPending || isSoldOut || quantity >= stock}
            className="h-9 w-9 rounded-lg border text-lg hover:bg-gray-50 disabled:opacity-50"
          >
            +
          </button>
        </div>

        {errorMessage && (
          <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
      >
        삭제
      </button>
    </div>
  );
}
