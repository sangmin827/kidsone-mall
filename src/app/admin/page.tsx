import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";

type StatCard = {
  label: string;
  count: number;
  color: string;
  bg: string;
  border: string;
  dot: string;
  href: string;
  urgent?: boolean;
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 병렬 카운트 조회
  const [
    { count: pendingCount },
    { count: paidCount },
    { count: preparingCount },
    { count: shippingCount },
    { count: deliveredCount },
    { count: cancelledCount },
    { count: cancelRequestedCount },
    { count: cancelWithdrawCount },
    { count: returnRequestedCount },
    { count: returnWithdrawCount },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "preparing"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "shipping"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "delivered"),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
    supabase.from("cancel_requests").select("*", { count: "exact", head: true }).eq("status", "requested"),
    supabase.from("cancel_requests").select("*", { count: "exact", head: true }).eq("status", "withdraw_requested"),
    supabase.from("return_requests").select("*", { count: "exact", head: true }).eq("status", "requested"),
    supabase.from("return_requests").select("*", { count: "exact", head: true }).eq("status", "withdraw_requested"),
  ]);

  const orderStats: StatCard[] = [
    {
      label: "입금 대기",
      count: pendingCount ?? 0,
      color: "text-[#92400e]",
      bg: "bg-[#fef9ec]",
      border: "border-[#D4AF37]/30",
      dot: "bg-[#D4AF37]",
      href: "/admin/orders?status=pending",
      urgent: (pendingCount ?? 0) > 0,
    },
    {
      label: "결제 완료",
      count: paidCount ?? 0,
      color: "text-[#5332C9]",
      bg: "bg-[#ede9fb]",
      border: "border-[#5332C9]/20",
      dot: "bg-[#5332C9]",
      href: "/admin/orders?status=paid",
    },
    {
      label: "상품 준비중",
      count: preparingCount ?? 0,
      color: "text-[#1d4ed8]",
      bg: "bg-blue-50",
      border: "border-blue-200",
      dot: "bg-[#3b82f6]",
      href: "/admin/orders?status=preparing",
    },
    {
      label: "배송 중",
      count: shippingCount ?? 0,
      color: "text-[#c2410c]",
      bg: "bg-orange-50",
      border: "border-orange-200",
      dot: "bg-[#f97316]",
      href: "/admin/orders?status=shipping",
    },
    {
      label: "배송 완료",
      count: deliveredCount ?? 0,
      color: "text-[#15803d]",
      bg: "bg-green-50",
      border: "border-green-200",
      dot: "bg-[#22c55e]",
      href: "/admin/orders?status=delivered",
    },
    {
      label: "취소 완료",
      count: cancelledCount ?? 0,
      color: "text-[#6b7280]",
      bg: "bg-[#f9fafb]",
      border: "border-[#E8E6E1]",
      dot: "bg-[#9ca3af]",
      href: "/admin/orders?status=cancelled",
    },
  ];

  const actionStats: StatCard[] = [
    {
      label: "취소 요청",
      count: cancelRequestedCount ?? 0,
      color: "text-[#c2410c]",
      bg: "bg-orange-50",
      border: "border-orange-200",
      dot: "bg-[#f97316]",
      href: "/admin/cancel-returns?type=cancel&status=requested",
      urgent: (cancelRequestedCount ?? 0) > 0,
    },
    {
      label: "취소 철회요청",
      count: cancelWithdrawCount ?? 0,
      color: "text-[#92400e]",
      bg: "bg-[#fefce8]",
      border: "border-[#fef08a]",
      dot: "bg-[#D4AF37]",
      href: "/admin/cancel-returns?type=cancel&status=withdraw_requested",
      urgent: (cancelWithdrawCount ?? 0) > 0,
    },
    {
      label: "반품 요청",
      count: returnRequestedCount ?? 0,
      color: "text-[#1d4ed8]",
      bg: "bg-blue-50",
      border: "border-blue-200",
      dot: "bg-[#3b82f6]",
      href: "/admin/cancel-returns?type=return&status=requested",
      urgent: (returnRequestedCount ?? 0) > 0,
    },
    {
      label: "반품 철회요청",
      count: returnWithdrawCount ?? 0,
      color: "text-[#92400e]",
      bg: "bg-[#fefce8]",
      border: "border-[#fef08a]",
      dot: "bg-[#D4AF37]",
      href: "/admin/cancel-returns?type=return&status=withdraw_requested",
      urgent: (returnWithdrawCount ?? 0) > 0,
    },
  ];

  const totalUrgent =
    (cancelRequestedCount ?? 0) +
    (cancelWithdrawCount ?? 0) +
    (returnRequestedCount ?? 0) +
    (returnWithdrawCount ?? 0) +
    (pendingCount ?? 0);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-black text-[#222222]">대시보드</h1>
        <p className="mt-1 text-sm text-[#9ca3af]">
          Kids One Mall 주문 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 긴급 처리 알림 */}
      {totalUrgent > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#FF5555]/20 bg-red-50 px-4 py-3.5">
          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#FF5555] text-[10px] font-black text-white">
            !
          </span>
          <div>
            <p className="text-sm font-bold text-[#FF5555]">
              처리 대기 중인 항목이 {totalUrgent}건 있습니다
            </p>
            <p className="mt-0.5 text-xs text-[#c2410c]">
              입금 대기, 취소/반품 요청을 확인해 주세요.
            </p>
          </div>
        </div>
      )}

      {/* 주문 현황 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-[#6b7280] uppercase tracking-wide">
          주문 현황
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {orderStats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={`group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${s.bg} ${s.border}`}
            >
              {s.urgent && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#FF5555] ring-2 ring-white" />
              )}
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full flex-none ${s.dot}`} />
                <span className={`text-xs font-semibold ${s.color}`}>
                  {s.label}
                </span>
              </div>
              <p className={`text-3xl font-black ${s.color}`}>
                {s.count.toLocaleString()}
                <span className="ml-0.5 text-sm font-normal">건</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 처리 필요 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-[#6b7280] uppercase tracking-wide">
          처리 필요
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actionStats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={`group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${s.bg} ${s.border}`}
            >
              {s.urgent && (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#FF5555] ring-2 ring-white" />
              )}
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full flex-none ${s.dot}`} />
                <span className={`text-xs font-semibold ${s.color}`}>
                  {s.label}
                </span>
              </div>
              <p className={`text-3xl font-black ${s.color}`}>
                {s.count.toLocaleString()}
                <span className="ml-0.5 text-sm font-normal">건</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 바로가기 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-[#6b7280] uppercase tracking-wide">
          바로가기
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "주문 내역", href: "/admin/orders", icon: "📦" },
            { label: "취소/반품", href: "/admin/cancel-returns", icon: "↩️" },
            { label: "회원 관리", href: "/admin/members", icon: "👥" },
            { label: "구매 요청", href: "/admin/purchase-requests", icon: "🛒" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl border border-[#E8E6E1] bg-white px-4 py-3.5 text-sm font-semibold text-[#222222] transition-all hover:-translate-y-0.5 hover:border-[#5332C9]/20 hover:shadow-md"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto text-[#9ca3af]"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
