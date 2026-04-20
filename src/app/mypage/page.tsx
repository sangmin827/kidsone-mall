import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/lib/supabase/server";
import { getMyOrders } from "@/src/server/orders";
import { getMyCart } from "@/src/server/cart";

// ── 주문 상태 한국어 + 스타일 매핑 ──────────────────────────
const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending: {
    label: "입금 대기",
    color: "text-[#D4AF37]",
    bg: "bg-[#fef9ec]",
    dot: "bg-[#D4AF37]",
  },
  paid: {
    label: "결제 완료",
    color: "text-[#5332C9]",
    bg: "bg-[#ede9fb]",
    dot: "bg-[#5332C9]",
  },
  preparing: {
    label: "상품 준비 중",
    color: "text-[#3b82f6]",
    bg: "bg-blue-50",
    dot: "bg-[#3b82f6]",
  },
  shipping: {
    label: "배송 중",
    color: "text-[#f97316]",
    bg: "bg-orange-50",
    dot: "bg-[#f97316]",
  },
  delivered: {
    label: "배송 완료",
    color: "text-[#22c55e]",
    bg: "bg-green-50",
    dot: "bg-[#22c55e]",
  },
  cancelled: {
    label: "취소",
    color: "text-[#9ca3af]",
    bg: "bg-[#FAF9F6]",
    dot: "bg-[#9ca3af]",
  },
};

const QUICK_ACTIONS = [
  { href: "/mypage/cart", icon: "🛒", label: "장바구니" },
  { href: "/mypage/addresses", icon: "📍", label: "주소지" },
  { href: "/mypage/profile", icon: "✏️", label: "내 정보" },
  { href: "/mypage/orders", icon: "📦", label: "전체 주문" },
];

const MENU_ITEMS = [
  {
    href: "/mypage/orders",
    title: "주문내역",
    desc: "주문한 상품과 배송 상태 확인",
  },
  {
    href: "/mypage/cart",
    title: "장바구니",
    desc: "담아둔 상품 확인 및 수량 변경",
  },
  {
    href: "/mypage/profile",
    title: "회원정보 수정",
    desc: "이름과 연락처 수정",
  },
  {
    href: "/mypage/addresses",
    title: "주소지 관리",
    desc: "배송지 추가 및 기본 배송지 관리",
  },
];

export default async function MyPage() {
  const supabase = await createClient();

  // ── 유저 정보 ──────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let profileName: string | null = null;
  let profileEmail: string | null = null;

  if (user) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .maybeSingle();
    profileName = prof?.name ?? null;
    profileEmail = prof?.email ?? user.email ?? null;
  }

  const displayName = profileName ?? profileEmail?.split("@")[0] ?? "회원";

  // ── 주문 데이터 ────────────────────────────────────────────
  let orders: Awaited<ReturnType<typeof getMyOrders>> = [];
  try {
    orders = await getMyOrders();
  } catch {
    /* 비로그인 등 무시 */
  }

  // 상태별 카운트
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  // 진행 중인 주문 (pending | paid | preparing | shipping)
  const activeCount =
    (statusCounts.pending ?? 0) +
    (statusCounts.paid ?? 0) +
    (statusCounts.preparing ?? 0) +
    (statusCounts.shipping ?? 0);

  // 최근 주문 3개
  const recentOrders = orders.slice(0, 3);

  // ── 장바구니 ───────────────────────────────────────────────
  let cartCount = 0;
  try {
    const cart = await getMyCart();
    cartCount = cart.items.length;
  } catch {
    /* 무시 */
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* ━━━ 상단 유저 카드 ━━━ */}
      <div className="bg-white border-b border-[#E8E6E1]">
        <div className="section-inner py-5 md:py-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              {/* 아바타 */}
              <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#ede9fb] text-xl md:text-2xl flex-none">
                👤
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-[#222222] md:text-lg">
                    {displayName}님, 안녕하세요! 👋
                  </h1>
                </div>
                <p className="mt-0.5 text-xs text-[#9ca3af] md:text-sm">
                  {profileEmail}
                </p>
              </div>
            </div>
            {activeCount > 0 && (
              <div className="flex-none flex items-center gap-1.5 rounded-full bg-[#ede9fb] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5332C9] animate-pulse" />
                <span className="text-xs font-semibold text-[#5332C9]">
                  진행 중 {activeCount}건
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="section-inner py-5 md:py-7 space-y-5 md:space-y-6">
        {/* ━━━ 주문 상태 요약 카드 ━━━ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#222222] md:text-base">
              주문 현황
            </h2>
            <Link
              href="/mypage/orders"
              className="text-xs font-medium text-[#5332C9] hover:underline"
            >
              전체 보기
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
            {(
              [
                "pending",
                "paid",
                "preparing",
                "shipping",
                "delivered",
                "cancelled",
              ] as const
            ).map((status) => {
              const info = STATUS_MAP[status];
              const count = statusCounts[status] ?? 0;
              return (
                <Link
                  key={status}
                  href="/mypage/orders"
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border border-[#E8E6E1] ${count > 0 ? info.bg : "bg-white"} px-2 py-3 transition-all active:scale-[0.97] hover:shadow-sm md:px-3 md:py-4`}
                >
                  <span
                    className={`text-lg font-black ${count > 0 ? info.color : "text-[#d1d5db]"} md:text-2xl`}
                  >
                    {count}
                  </span>
                  <span
                    className={`text-center text-[10px] font-medium leading-tight ${count > 0 ? info.color : "text-[#9ca3af]"} md:text-xs`}
                  >
                    {info.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ━━━ 빠른 액션 ━━━ */}
        <section>
          <h2 className="mb-3 text-sm font-bold text-[#222222] md:text-base">
            빠른 액션
          </h2>
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="relative flex flex-col items-center gap-2 rounded-2xl border border-[#E8E6E1] bg-white py-4 px-2 transition-all active:scale-[0.97] hover:shadow-sm hover:border-[#5332C9]/30 md:py-5"
              >
                <span className="text-2xl md:text-3xl">{a.icon}</span>
                <span className="text-[11px] font-medium text-[#222222] md:text-xs">
                  {a.label}
                </span>
                {/* 장바구니 뱃지 */}
                {a.href === "/mypage/cart" && cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5555] text-[10px] font-bold text-white shadow">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* ━━━ 최근 주문 ━━━ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#222222] md:text-base">
              최근 주문
            </h2>
            <Link
              href="/mypage/orders"
              className="text-xs font-medium text-[#5332C9] hover:underline"
            >
              전체 보기
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            /* Empty 상태 */
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#E8E6E1] bg-white py-10 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF9F6] text-3xl">
                📦
              </div>
              <div>
                <p className="text-sm font-semibold text-[#222222]">
                  아직 주문 내역이 없어요
                </p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  첫 번째 주문을 해보세요!
                </p>
              </div>
              <Link
                href="/products"
                className="btn-primary text-xs px-5 py-2.5"
              >
                상품 보러가기
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const status = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
                const firstItem = order.order_items[0];
                const dateStr = new Date(order.created_at).toLocaleDateString(
                  "ko-KR",
                  {
                    month: "long",
                    day: "numeric",
                  },
                );

                return (
                  <Link
                    key={order.id}
                    href="/mypage/orders"
                    className="flex items-center gap-3 rounded-2xl border border-[#E8E6E1] bg-white p-4 transition-all active:scale-[0.99] hover:shadow-sm md:gap-4 md:p-5"
                  >
                    {/* 상품 이미지 placeholder */}
                    <div className="flex-none flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF9F6] text-xl md:h-14 md:w-14">
                      📦
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.color}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />
                          {status.label}
                        </span>
                        <span className="text-[11px] text-[#9ca3af]">
                          {dateStr}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-sm font-semibold text-[#222222]">
                        {firstItem?.product_name_snapshot ?? "상품명 없음"}
                        {order.order_items.length > 1 && (
                          <span className="ml-1 text-xs font-normal text-[#9ca3af]">
                            외 {order.order_items.length - 1}건
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[#6b7280]">
                        주문번호 {order.order_number}
                      </p>
                    </div>

                    <div className="flex-none text-right">
                      <p className="text-sm font-bold text-[#222222] md:text-base">
                        {order.total_amount.toLocaleString()}원
                      </p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ml-auto mt-1"
                        aria-hidden="true"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
