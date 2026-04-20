import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

/**
 * /admin/* 전역 가드.
 *
 * - 비로그인 → /login?next=<현재경로> 로 이동
 * - 로그인했지만 role !== 'admin' → / 로 이동 (조용히)
 * - admin → 정상 렌더
 *
 * 새 관리자 페이지를 추가해도 이 레이아웃이 자동 적용되므로
 * 각 페이지에서 requireAdmin() 을 호출하지 않아도 최소한의 방어가 유지된다.
 * (단, 서버 액션/서버 함수 수준의 requireAdmin() 은 defense-in-depth 로 그대로 유지)
 */
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
    // 홈으로 보내면서 로그인 모달을 띄우고, 성공 후 /admin 으로 복귀.
    redirect("/?login=1&next=/admin");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    // 관리자가 아니면 조용히 홈으로 보낸다.
    // 403 페이지 대신 홈 리다이렉트를 쓰는 이유:
    //   - "관리자 페이지가 있다"는 사실 자체를 노출하지 않기 위함
    //   - 실수로 접근한 일반 유저에게 덜 위협적
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}
      </div>
    </div>
  );
}
