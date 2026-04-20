"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { removeCartItemAction, setCartItemQuantityAction } from "@/src/app/mypage/cart/actions";

type ProductImage = { image_url: string; is_thumbnail: boolean | null; sort_order: number | null };
type CartProduct = { id: number; name: string; slug: string; price: number; stock: number; product_images: ProductImage[] | null };
type CartItem = { id: number; quantity: number; products: CartProduct | null };
type Props = { initialItems: CartItem[] };

export default function CartClient({ initialItems }: Props) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [errorMessage, setErrorMessage] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const latestItemsRef = useRef<CartItem[]>(initialItems);

  useEffect(() => { latestItemsRef.current = items; }, [items]);
  useEffect(() => { return () => { Object.values(debounceTimers.current).forEach(clearTimeout); }; }, []);

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + (i.products?.price ?? 0) * i.quantity, 0);
  const hasSoldOutItem = items.some((i) => i.products && i.products.stock <= 0);
  const hasOverStockItem = items.some((i) => i.products && i.quantity > i.products.stock);
  const canOrder = !hasSoldOutItem && !hasOverStockItem && items.length > 0;

  const clamp = (v: number, stock: number) => {
    if (Number.isNaN(v)) return 1;
    if (v < 1) return 1;
    if (stock > 0 && v > stock) return stock;
    return v;
  };

  const syncToServer = (cartItemId: number, quantity: number) => {
    if (debounceTimers.current[cartItemId]) clearTimeout(debounceTimers.current[cartItemId]);
    debounceTimers.current[cartItemId] = setTimeout(async () => {
      const prev = latestItemsRef.current;
      const fd = new FormData();
      fd.set("cartItemId", String(cartItemId));
      fd.set("quantity", String(quantity));
      const res = await setCartItemQuantityAction(fd);
      if (!res.ok) {
        setItems(prev);
        setErrorMessage(res.message);
        toast.error(res.message, { id: `qty-${cartItemId}`, duration: 2000 });
      }
    }, 250);
  };

  const updateQty = (id: number, qty: number) => {
    setItems((cur) => cur.map((i) => i.id === id ? { ...i, quantity: qty } : i));
    setErrorMessage("");
    syncToServer(id, qty);
  };

  const handleRemove = async (cartItemId: number) => {
    const prev = latestItemsRef.current;
    if (debounceTimers.current[cartItemId]) { clearTimeout(debounceTimers.current[cartItemId]); delete debounceTimers.current[cartItemId]; }
    setRemovingId(cartItemId);
    setItems((cur) => cur.filter((i) => i.id !== cartItemId));
    setErrorMessage("");
    const fd = new FormData();
    fd.set("cartItemId", String(cartItemId));
    const res = await removeCartItemAction(fd);
    if (res.ok) {
      toast.success("삭제했습니다.", { id: `rm-${cartItemId}`, duration: 1500 });
    } else {
      setItems(prev);
      setErrorMessage(res.message);
      toast.error(res.message, { id: `rm-${cartItemId}`, duration: 2500 });
    }
    setRemovingId(null);
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b border-[#E8E6E1]">
        <div className="section-inner py-5 md:py-6">
          <h1 className="text-xl font-bold text-[#222222] font-gmarket md:text-3xl">장바구니</h1>
          {items.length > 0 && <p className="mt-1 text-xs text-[#6b7280] md:text-sm">총 {totalQuantity}개의 상품</p>}
        </div>
      </div>

      {/* ━━━ 빈 상태 ━━━ */}
      {items.length === 0 ? (
        <div className="section-inner py-6 md:py-8">
          <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-[#E8E6E1] bg-white py-16 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF9F6] text-4xl">🛒</div>
            <div className="space-y-1.5">
              <p className="text-base font-bold text-[#222222]">장바구니가 비어 있어요</p>
              <p className="text-sm text-[#6b7280]">마음에 드는 상품을 담아보세요!</p>
            </div>
            <Link href="/products" className="btn-primary mt-2">상품 보러가기</Link>
          </div>
        </div>
      ) : (
        <>
          {/*
           * 모바일: 단일 컬럼, 하단에 sticky 주문 바
           * PC: 1fr + 320px 사이드 컬럼
           *
           * 모바일에서 주문 버튼이 sticky 하단 바에 있으므로
           * 콘텐츠 하단에 pb-28(sticky 바 높이)을 줘서 가려지지 않게 함
           */}
          <div className="section-inner py-4 pb-28 md:pb-8 md:py-6 md:py-8">
            <div className="grid gap-6 md:grid-cols-[1fr_320px]">

              {/* ── 상품 목록 ── */}
              <div className="space-y-3">
                {items.map((item) => {
                  const p = item.products;
                  if (!p) return null;
                  const thumb = p.product_images?.find((img) => img.is_thumbnail)?.image_url ?? p.product_images?.[0]?.image_url ?? "/placeholder.png";
                  const itemTotal = p.price * item.quantity;
                  const isSoldOut = p.stock <= 0;
                  const isOverStock = item.quantity > p.stock;

                  return (
                    <div key={item.id} className="rounded-2xl border border-[#E8E6E1] bg-white p-4">
                      {/* 상단: 이미지 + 정보 + 금액 */}
                      <div className="flex gap-3">
                        <Link href={`/products/${p.slug}`} className="flex-none">
                          <div className="relative h-[72px] w-[72px] md:h-24 md:w-24 overflow-hidden rounded-xl bg-[#f5f4f1]">
                            <Image src={thumb} alt={p.name} fill className="object-cover" sizes="96px" />
                          </div>
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-semibold text-[#222222] hover:text-[#5332C9] transition-colors leading-snug">
                            {p.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-[#9ca3af]">{p.price.toLocaleString()}원 / 개</p>
                          {(isSoldOut || isOverStock) && (
                            <div className="mt-1.5 flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FF5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              <p className="text-[11px] font-medium text-[#FF5555]">
                                {isSoldOut ? "품절" : `재고 초과 (${p.stock}개)`}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 상품 합계 — 모바일에서도 오른쪽에 */}
                        <div className="flex-none text-right">
                          <p className="text-sm font-bold text-[#222222] md:text-base">{itemTotal.toLocaleString()}원</p>
                        </div>
                      </div>

                      {/* 하단: 수량 조절 + 삭제 */}
                      <div className="mt-3 flex items-center justify-between border-t border-[#E8E6E1] pt-3">
                        {/*
                         * 수량 조절: 터치 타깃 최소 44px
                         * 모바일에서도 손가락으로 쉽게 탭 가능하도록 h-11
                         */}
                        <div className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => { if (item.quantity > 1) updateQty(item.id, item.quantity - 1); }}
                            disabled={item.quantity <= 1}
                            className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl border border-[#E8E6E1] text-[#222222] transition-colors hover:border-[#5332C9] hover:text-[#5332C9] active:bg-[#ede9fb] disabled:opacity-40"
                            aria-label="수량 감소">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>

                          <input type="number" min={1} max={p.stock > 0 ? p.stock : 1} value={item.quantity}
                            onChange={(e) => {
                              const next = e.target.value === "" ? 1 : clamp(Number(e.target.value), p.stock);
                              setItems((cur) => cur.map((ci) => ci.id === item.id ? { ...ci, quantity: next } : ci));
                            }}
                            onBlur={() => updateQty(item.id, clamp(item.quantity, p.stock))}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                            className="h-9 w-14 md:h-10 md:w-16 rounded-xl border border-[#E8E6E1] text-center text-sm font-semibold outline-none focus:border-[#5332C9] focus:ring-2 focus:ring-[#5332C9]/15"
                            aria-label="수량" />

                          <button type="button"
                            onClick={() => { if (!isSoldOut && item.quantity < p.stock) updateQty(item.id, item.quantity + 1); }}
                            disabled={isSoldOut || item.quantity >= p.stock}
                            className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl border border-[#E8E6E1] text-[#222222] transition-colors hover:border-[#5332C9] hover:text-[#5332C9] active:bg-[#ede9fb] disabled:opacity-40"
                            aria-label="수량 증가">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </button>
                        </div>

                        {/* 삭제 버튼 — 터치하기 쉬운 크기 */}
                        <button type="button" onClick={() => handleRemove(item.id)} disabled={removingId === item.id}
                          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-[#9ca3af] transition-colors hover:bg-red-50 hover:text-[#FF5555] active:scale-[0.97] disabled:opacity-50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="text-sm text-[#FF5555]">{errorMessage}</p>
                  </div>
                )}
              </div>

              {/* ── PC 전용 주문 요약 사이드바 ── */}
              <aside className="hidden md:block h-fit rounded-2xl border border-[#E8E6E1] bg-white p-6 lg:sticky lg:top-24">
                <h2 className="text-base font-bold text-[#222222]">주문 요약</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-[#6b7280]">총 수량</span><span className="font-medium">{totalQuantity}개</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#6b7280]">상품 금액</span><span className="font-medium">{totalAmount.toLocaleString()}원</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#6b7280]">배송비</span><span className="font-medium text-[#22c55e]">무료</span></div>
                </div>
                <div className="mt-4 border-t border-[#E8E6E1] pt-4 flex justify-between">
                  <span className="text-sm font-bold">총 결제금액</span>
                  <span className="text-xl font-black">{totalAmount.toLocaleString()}원</span>
                </div>
                {!canOrder && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="text-xs font-medium text-[#FF5555]">품절 또는 재고 초과 상품이 있어 주문할 수 없습니다.</p>
                  </div>
                )}
                <Link href="/checkout?mode=cart"
                  className={`mt-5 block w-full rounded-xl px-4 py-3.5 text-center text-sm font-bold text-white transition-all ${canOrder ? "bg-[#FF5555] hover:bg-[#e84444] active:scale-[0.98]" : "pointer-events-none bg-[#d1d5db]"}`}
                  aria-disabled={!canOrder}>
                  주문하기
                </Link>
                <Link href="/products" className="mt-3 block w-full rounded-xl border border-[#E8E6E1] px-4 py-3 text-center text-sm font-medium text-[#6b7280] hover:border-[#5332C9] hover:text-[#5332C9] transition-colors">
                  쇼핑 계속하기
                </Link>
              </aside>
            </div>
          </div>

          {/*
           * ━━━ 모바일 전용 Sticky 하단 주문 바 ━━━
           * - 화면 하단에 고정 (z-40)
           * - 왼쪽: 총 금액
           * - 오른쪽: 주문하기 버튼
           * - pb-safe: iOS safe area 대응
           */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E8E6E1] bg-white px-4 py-3 md:hidden"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
            {!canOrder && (
              <p className="mb-2 text-center text-xs font-medium text-[#FF5555]">
                {hasSoldOutItem ? "품절 상품이 있어요" : "재고 초과 상품이 있어요"}
              </p>
            )}
            <div className="flex items-center gap-3">
              {/* 금액 요약 */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#9ca3af]">총 결제금액</p>
                <p className="text-lg font-black text-[#222222] leading-tight">{totalAmount.toLocaleString()}<span className="text-sm font-normal text-[#6b7280]">원</span></p>
              </div>
              {/* 주문 버튼 — 충분한 터치 타깃 */}
              <Link href="/checkout?mode=cart"
                className={`flex-none rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-all ${canOrder ? "bg-[#FF5555] active:scale-[0.97]" : "pointer-events-none bg-[#d1d5db]"}`}
                aria-disabled={!canOrder}>
                주문하기
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
