'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {
  BankAccount,
  CheckoutItem,
  SavedAddress,
} from '@/src/server/checkout';

type Props = {
  initialItems: CheckoutItem[];
  addresses: SavedAddress[];
  bankAccounts: BankAccount[];
};

type AddressMode = 'new' | 'default' | 'saved';

export default function CheckoutClient({
  initialItems,
  addresses,
  bankAccounts,
}: Props) {
  const [items, setItems] = useState<CheckoutItem[]>(initialItems);

  const defaultAddress =
    addresses.find((address) => address.is_default) ?? null;
  const [addressMode, setAddressMode] = useState<AddressMode>(
    defaultAddress ? 'default' : addresses.length > 0 ? 'saved' : 'new',
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    defaultAddress?.id ?? addresses[0]?.id ?? null,
  );

  const detailAddressRef = useRef<HTMLInputElement>(null);

  const [newAddress, setNewAddress] = useState({
    recipient_name: '',
    recipient_phone: '',
    postal_code: '',
    address_main: '',
    address_detail: '',
    memo: '',
  });

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const hasInvalidItem = items.some(
    (item) => item.stock <= 0 || item.quantity > item.stock,
  );

  const increaseQuantity = (productId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: Math.min(item.stock, item.quantity + 1),
            }
          : item,
      ),
    );
  };

  const decreaseQuantity = (productId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: Math.max(1, item.quantity - 1),
            }
          : item,
      ),
    );
  };

  const setQuantity = (productId: number, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(item.stock, value || 1)),
            }
          : item,
      ),
    );
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const selectedSavedAddress =
    addresses.find((address) => address.id === selectedAddressId) ?? null;

  const handleSearchAddress = () => {
    if (!window.kakao?.Postcode) {
      alert('주소 검색 서비스를 불러오지 못했습니다.');
      return;
    }

    new window.kakao.Postcode({
      oncomplete: (data: {
        userSelectedType: string;
        roadAddress: string;
        jibunAddress: string;
        bname: string;
        buildingName: string;
        apartment: string;
        zonecode: string;
      }) => {
        let addr = '';
        let extraAddr = '';

        if (data.userSelectedType === 'R') {
          addr = data.roadAddress;
        } else {
          addr = data.jibunAddress;
        }

        if (data.userSelectedType === 'R') {
          if (data.bname && /[동로가]$/.test(data.bname)) {
            extraAddr += data.bname;
          }

          if (data.buildingName && data.apartment === 'Y') {
            extraAddr += extraAddr
              ? `, ${data.buildingName}`
              : data.buildingName;
          }

          if (extraAddr) {
            addr += ` (${extraAddr})`;
          }
        }

        setNewAddress((prev) => ({
          ...prev,
          postal_code: data.zonecode,
          address_main: addr,
        }));

        setTimeout(() => {
          detailAddressRef.current?.focus();
        }, 0);
      },
    }).open();
  };

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold">주문 상품</h2>

          <div className="mt-4 space-y-4">
            {items.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <p className="text-sm text-gray-600">주문할 상품이 없습니다.</p>
                <Link
                  href="/products"
                  className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
                >
                  상품 보러가기
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const itemTotal = item.price * item.quantity;
                const isSoldOut = item.stock <= 0;
                const isOverStock = item.quantity > item.stock;

                return (
                  <div key={item.product_id} className="rounded-2xl border p-4">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-gray-100">
                        <Image
                          src={item.image_url ?? '/placeholder.png'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          단가: {item.price.toLocaleString()}원
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          재고: {item.stock}개
                        </p>

                        {(isSoldOut || isOverStock) && (
                          <p className="mt-2 text-sm font-medium text-red-500">
                            {isSoldOut
                              ? '품절된 상품입니다.'
                              : `재고보다 많이 선택했습니다. 현재 재고: ${item.stock}개`}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">상품 합계</p>
                        <p className="font-semibold">
                          {itemTotal.toLocaleString()}원
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.product_id)}
                          className="h-9 w-9 rounded-lg border text-lg hover:bg-gray-50"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={item.stock > 0 ? item.stock : 1}
                          value={item.quantity}
                          onChange={(e) =>
                            setQuantity(item.product_id, Number(e.target.value))
                          }
                          className="h-9 w-20 rounded-lg border text-center text-sm font-semibold outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.product_id)}
                          disabled={isSoldOut || item.quantity >= item.stock}
                          className="h-9 w-9 rounded-lg border text-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product_id)}
                        className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold">배송지 선택</h2>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="addressMode"
                checked={addressMode === 'new'}
                onChange={() => setAddressMode('new')}
              />
              <span className="text-sm">새로운 주소지 입력</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="addressMode"
                checked={addressMode === 'default'}
                onChange={() => setAddressMode('default')}
                disabled={!defaultAddress}
              />
              <span className="text-sm">기본 주소지 선택</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="addressMode"
                checked={addressMode === 'saved'}
                onChange={() => setAddressMode('saved')}
                disabled={addresses.length === 0}
              />
              <span className="text-sm">저장된 주소지에서 선택</span>
            </label>
          </div>

          {addressMode === 'new' && (
            <div className="mt-5 space-y-3">
              <input
                placeholder="수령자 이름"
                value={newAddress.recipient_name}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    recipient_name: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />

              <input
                placeholder="수령자 연락처"
                value={newAddress.recipient_phone}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    recipient_phone: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />

              <div className="flex gap-2">
                <input
                  value={newAddress.postal_code}
                  readOnly
                  placeholder="우편번호"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  className="shrink-0 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium"
                >
                  주소 검색
                </button>
              </div>

              <input
                value={newAddress.address_main}
                readOnly
                placeholder="기본 주소"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
              />

              <input
                ref={detailAddressRef}
                value={newAddress.address_detail}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    address_detail: e.target.value,
                  }))
                }
                placeholder="상세 주소"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />

              <input
                value={newAddress.memo}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    memo: e.target.value,
                  }))
                }
                placeholder="비고사항"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {addressMode === 'default' && defaultAddress && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <p>받는 사람: {defaultAddress.recipient_name}</p>
              <p className="mt-1">연락처: {defaultAddress.recipient_phone}</p>
              <p className="mt-1">
                주소: ({defaultAddress.zip_code}) {defaultAddress.address}{' '}
                {defaultAddress.detail_address ?? ''}
              </p>
            </div>
          )}

          {addressMode === 'saved' && (
            <div className="mt-5 space-y-3">
              <select
                value={selectedAddressId ?? ''}
                onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="">주소를 선택하세요</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.recipient_name} / {address.address}
                  </option>
                ))}
              </select>

              {selectedSavedAddress && (
                <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                  <p>받는 사람: {selectedSavedAddress.recipient_name}</p>
                  <p className="mt-1">
                    연락처: {selectedSavedAddress.recipient_phone}
                  </p>
                  <p className="mt-1">
                    주소: ({selectedSavedAddress.zip_code}){' '}
                    {selectedSavedAddress.address}{' '}
                    {selectedSavedAddress.detail_address ?? ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold">결제 수단</h2>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">무통장 입금</p>

            <div className="mt-3 space-y-2 text-sm text-gray-700">
              {bankAccounts.length === 0 ? (
                <p>등록된 입금 계좌가 없습니다.</p>
              ) : (
                bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-lg border bg-white p-3"
                  >
                    <p>은행명: {account.bank_name}</p>
                    <p>계좌번호: {account.account_number}</p>
                    <p>예금주: {account.account_holder}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border bg-white p-6 xl:sticky xl:top-24">
        <h2 className="text-lg font-bold">주문 요약</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>총 상품 수량</span>
            <span>{totalQuantity}개</span>
          </div>

          <div className="flex items-center justify-between">
            <span>총 상품금액</span>
            <span>{totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between font-semibold">
            <span>총 결제금액</span>
            <span>{totalAmount.toLocaleString()}원</span>
          </div>
        </div>

        {hasInvalidItem && (
          <p className="mt-4 text-sm font-medium text-red-500">
            품절 또는 재고 초과 상품이 있어 주문할 수 없습니다.
          </p>
        )}

        <button
          type="button"
          disabled={items.length === 0 || hasInvalidItem}
          className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-white disabled:bg-gray-400"
        >
          무통장 주문하기
        </button>
      </aside>
    </div>
  );
}
