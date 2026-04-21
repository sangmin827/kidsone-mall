"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type {
  BankAccount,
  CheckoutItem,
  SavedAddress,
} from "@/src/server/checkout";
import type { SaveAddressRequest } from "@/src/types/address";
import { toast } from "sonner";
import { addToCartAction } from "@/src/app/products/[slug]/actions";

type Props = {
  initialItems: CheckoutItem[];
  addresses: SavedAddress[];
  bankAccounts: BankAccount[];
  isLoggedIn: boolean;
  // 'single' | 'cart' | 'cart_plus_current' — 결제 후 장바구니 비움 여부 판단용
  mode?: string;
};

type AddressMode = "new" | "default" | "saved";

export default function CheckoutClient({
  initialItems,
  addresses,
  bankAccounts,
  isLoggedIn,
  mode,
}: Props) {
  const [items, setItems] = useState<CheckoutItem[]>(initialItems);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isCartPending, startTransition] = useTransition();
  const router = useRouter();

  const defaultAddress =
    addresses.find((address) => address.is_default) ?? null;
  const [addressMode, setAddressMode] = useState<AddressMode>(
    !isLoggedIn
      ? "new"
      : defaultAddress
        ? "default"
        : addresses.length > 0
          ? "saved"
          : "new",
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    defaultAddress?.id ?? addresses[0]?.id ?? null,
  );

  const handleAddSingleItemToCart = (productId: number, quantity: number) => {
    const formData = new FormData();
    formData.set("productId", String(productId));
    formData.set("quantity", String(quantity));

    startTransition(async () => {
      const result = await addToCartAction(formData);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const detailAddressRef = useRef<HTMLInputElement>(null);

  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    recipient_phone: "",
    recipient_phone_extra: "",
    postal_code: "",
    address_main: "",
    address_detail: "",
    memo: "",
  });

  const [orderer, setOrderer] = useState({
    orderer_name: "",
    orderer_phone: "",
    orderer_email: "",
  });

  const [depositorName, setDepositorName] = useState("");

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

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
      toast.warning("주소 검색 서비스를 불러오지 못했습니다.", {
        duration: 2000,
      });
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
        let addr = "";
        let extraAddr = "";

        if (data.userSelectedType === "R") {
          addr = data.roadAddress;
        } else {
          addr = data.jibunAddress;
        }

        if (data.userSelectedType === "R") {
          if (data.bname && /[동로가]$/.test(data.bname)) {
            extraAddr += data.bname;
          }

          if (data.buildingName && data.apartment === "Y") {
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

  const handleOrder = async () => {
    if (isOrdering) return;

    // 입금자명 필수 검증 (무통장 입금 결제이므로 입금자명이 필수)
    const depositor_name = depositorName.trim();
    if (!depositor_name) {
      toast.warning("입금자명을 입력해주세요.", { duration: 2000 });
      return;
    }

    const toastId = toast.loading("주문 처리 중...");

    try {
      setIsOrdering(true);

      let recipient_name = "";
      let recipient_phone = "";
      let recipient_phone_extra = "";
      let zip_code = "";
      let address = "";
      let detail_address = "";
      let request_message = "";

      if (addressMode === "new") {
        recipient_name = newAddress.recipient_name.trim();
        recipient_phone = newAddress.recipient_phone.trim();
        recipient_phone_extra = newAddress.recipient_phone_extra.trim();
        zip_code = newAddress.postal_code.trim();
        address = newAddress.address_main.trim();
        detail_address = newAddress.address_detail.trim();
        request_message = newAddress.memo.trim();

        if (
          !recipient_name ||
          !recipient_phone ||
          !zip_code ||
          !address ||
          !detail_address
        ) {
          toast.warning("배송지 정보를 모두 입력해주세요.", {
            id: toastId,
            duration: 2000,
          });
          return;
        }

        const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;

        if (!phoneRegex.test(recipient_phone)) {
          toast.warning("연락처는 010-1234-5678 형식으로 입력해주세요.", {
            id: toastId,
            duration: 2000,
          });
          return;
        }
        if (recipient_phone_extra && !phoneRegex.test(recipient_phone_extra)) {
          toast.warning(
            "수령자 연락처 2는 010-1234-5678 형식으로 입력해주세요.",
            {
              id: toastId,
              duration: 2000,
            },
          );
          return;
        }

        if (!isLoggedIn) {
          const orderer_name = orderer.orderer_name.trim();
          const orderer_phone = orderer.orderer_phone.trim();
          const orderer_email = orderer.orderer_email.trim();

          if (!orderer_name || !orderer_phone || !orderer_email) {
            toast.warning(
              "비회원 주문자는 이름, 연락처, 이메일을 모두 입력해주세요.",
              {
                id: toastId,
                duration: 2000,
              },
            );
            return;
          }

          if (!phoneRegex.test(orderer_phone)) {
            toast.warning(
              "주문자 연락처는 010-1234-5678 형식으로 입력해주세요.",
              {
                id: toastId,
                duration: 2000,
              },
            );
            return;
          }
        }

        if (saveNewAddress) {
          // SaveAddressRequest 타입으로 명시 → 필드명 불일치를 TypeScript가 컴파일 시점에 감지
          const savePayload: SaveAddressRequest = {
            recipient_name,
            recipient_phone,
            recipient_phone_extra,
            postal_code: zip_code,
            address_main: address,
            address_detail: detail_address,
            memo: request_message,
          };
          const addressRes = await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(savePayload),
          });

          const addressData = await addressRes.json();

          if (!addressRes.ok || !addressData.ok) {
            throw new Error(addressData.message ?? "주소 저장에 실패했습니다.");
          }
          toast.success("주소가 저장되었습니다.", { duration: 1500 });
        }
      } else if (addressMode === "default" && defaultAddress) {
        recipient_name = defaultAddress.recipient_name;
        recipient_phone = defaultAddress.recipient_phone;
        zip_code = defaultAddress.zip_code ?? "";
        address = defaultAddress.address;
        detail_address = defaultAddress.detail_address ?? "";
        request_message = "";
      } else if (addressMode === "saved" && selectedSavedAddress) {
        recipient_name = selectedSavedAddress.recipient_name;
        recipient_phone = selectedSavedAddress.recipient_phone;
        zip_code = selectedSavedAddress.zip_code ?? "";
        address = selectedSavedAddress.address;
        detail_address = selectedSavedAddress.detail_address ?? "";
        request_message = "";
      } else {
        toast.warning("배송지를 선택해주세요.", {
          id: toastId,
          duration: 2000,
        });
        return;
      }

      // mode=single 이 아닌 경우(cart / cart_plus_current) 결제 성공 시 장바구니 비움
      const clearCart = mode !== "single";

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_name,
          recipient_phone,
          recipient_phone_extra,
          zip_code,
          address,
          detail_address,
          request_message,
          depositor_name,
          orderer_name: isLoggedIn ? undefined : orderer.orderer_name.trim(),
          orderer_phone: isLoggedIn ? undefined : orderer.orderer_phone.trim(),
          orderer_email: isLoggedIn ? undefined : orderer.orderer_email.trim(),
          // 회원/비회원 모두 클라이언트가 최종 items 를 전달 → 바로구매 등에서도 정확히 주문됨
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          clear_cart: clearCart,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.ok) {
        throw new Error(orderData.message ?? "주문에 실패했습니다.");
      }

      toast.success("주문이 완료되었습니다!", { id: toastId, duration: 1500 });
      if (isLoggedIn) {
        router.push(`/checkout/complete?orderNumber=${encodeURIComponent(orderData.order.order_number)}`);
      } else {
        router.push(
          `/guest-order/complete?orderNumber=${encodeURIComponent(orderData.order.order_number)}&phone=${encodeURIComponent(orderer.orderer_phone.trim())}`,
        );
      }
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "주문 처리 중 오류가 발생했습니다.",
        { id: toastId, duration: 2000 },
      );
    } finally {
      setIsOrdering(false);
    }
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
                          src={item.image_url ?? "/placeholder.png"}
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
                              ? "품절된 상품입니다."
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
                      <div>
                        {!item.from_cart && isLoggedIn && (
                          <button
                            type="button"
                            onClick={() =>
                              handleAddSingleItemToCart(
                                item.product_id,
                                item.quantity,
                              )
                            }
                            disabled={isCartPending}
                            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 mr-3"
                          >
                            {isCartPending ? "담는 중..." : "장바구니 담기"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeItem(item.product_id)}
                          className="rounded-lg border px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
        {!isLoggedIn && (
          <section className="rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-bold">주문자 정보</h2>

            <div className="mt-4 space-y-3">
              <input
                placeholder="주문자 이름"
                value={orderer.orderer_name}
                onChange={(e) =>
                  setOrderer((prev) => ({
                    ...prev,
                    orderer_name: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />

              <input
                type="tel"
                inputMode="numeric"
                maxLength={13}
                placeholder="주문자 연락처 (010-1234-5678)"
                value={orderer.orderer_phone}
                onChange={(e) =>
                  setOrderer((prev) => ({
                    ...prev,
                    orderer_phone: formatPhone(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />

              <input
                type="email"
                placeholder="주문자 이메일"
                value={orderer.orderer_email}
                onChange={(e) =>
                  setOrderer((prev) => ({
                    ...prev,
                    orderer_email: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500">
                해당 이메일로 주문내역이 발송됩니다
              </p>
            </div>
          </section>
        )}
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-bold">배송지 정보</h2>
          {isLoggedIn && (
            <div className="space-y-2">
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addressMode"
                    checked={addressMode === "new"}
                    onChange={() => setAddressMode("new")}
                  />
                  <span className="text-sm">새로운 주소지 입력</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addressMode"
                    checked={addressMode === "default"}
                    onChange={() => setAddressMode("default")}
                    disabled={!defaultAddress}
                  />
                  <span className="text-sm">기본 주소지 선택</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addressMode"
                    checked={addressMode === "saved"}
                    onChange={() => setAddressMode("saved")}
                    disabled={addresses.length === 0}
                  />
                  <span className="text-sm">저장된 주소지에서 선택</span>
                </label>
              </div>
            </div>
          )}
          {addressMode === "new" && (
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
                type="tel"
                inputMode="numeric"
                maxLength={13}
                placeholder="수령자 연락처 (010-1234-5678)"
                value={newAddress.recipient_phone}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    recipient_phone: formatPhone(e.target.value),
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={13}
                placeholder="수령자 연락처 2 (선택)"
                value={newAddress.recipient_phone_extra}
                onChange={(e) =>
                  setNewAddress((prev) => ({
                    ...prev,
                    recipient_phone_extra: formatPhone(e.target.value),
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
                placeholder='상세 주소 (동, 호수가 없는 주택은 "주택"으로 남겨주세요)'
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
                placeholder="배송 메시지 or 기타사항"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
              {isLoggedIn && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={saveNewAddress}
                        disabled={addresses.length >= 3}
                        onChange={(e) => setSaveNewAddress(e.target.checked)}
                      />
                      <span className="text-sm">이 주소를 주소록에 저장</span>
                    </label>

                    {addresses.length >= 3 && (
                      <p className="text-sm text-red-500">
                        배송지는 최대 3개까지만 저장할 수 있습니다.
                      </p>
                    )}

                    {saveNewAddress && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={saveAsDefault}
                          onChange={(e) => setSaveAsDefault(e.target.checked)}
                        />
                        <span className="text-sm">기본 배송지로 저장</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {addressMode === "default" && defaultAddress && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
              <p>받는 사람: {defaultAddress.recipient_name}</p>
              <p className="mt-1">연락처: {defaultAddress.recipient_phone}</p>
              <p className="mt-1">
                주소: ({defaultAddress.zip_code}) {defaultAddress.address}{" "}
                {defaultAddress.detail_address ?? ""}
              </p>
            </div>
          )}

          {addressMode === "saved" && (
            <div className="mt-5 space-y-3">
              <select
                value={selectedAddressId ?? ""}
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
                    주소: ({selectedSavedAddress.zip_code}){" "}
                    {selectedSavedAddress.address}{" "}
                    {selectedSavedAddress.detail_address ?? ""}
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

          <div className="mt-4 space-y-2">
            <label
              htmlFor="depositor_name"
              className="block text-sm font-semibold text-gray-900"
            >
              입금자명
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input
              id="depositor_name"
              name="depositor_name"
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금하실 때 사용할 입금자명을 입력해주세요"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-xs font-medium text-red-500">
              하단에 입금자 명으로 입금해야 확인 가능
            </p>
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
          onClick={handleOrder}
          disabled={isOrdering || items.length === 0 || hasInvalidItem}
          className="mt-6 w-full rounded-xl bg-black px-4 py-3 text-white disabled:bg-gray-400"
        >
          {isOrdering ? "주문 처리 중..." : "무통장 주문하기"}
        </button>
      </aside>
    </div>
  );
}
