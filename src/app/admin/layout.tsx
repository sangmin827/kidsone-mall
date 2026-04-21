import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import AdminShell from "@/src/components/admin/layout/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=1&next=/admin");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/");
  }

  // 사이드바 배지용 카운트 (병렬 조회)
  const [{ count: pendingOrderCount }, { count: pendingPurchaseCount }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("purchase_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  return (
    <AdminShell
      pendingOrderCount={pendingOrderCount ?? 0}
      pendingPurchaseCount={pendingPurchaseCount ?? 0}
    >
      {children}
    </AdminShell>
  );
}
