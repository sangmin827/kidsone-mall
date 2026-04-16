"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { logout } from "@/src/app/logout/actions";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    const loadingToastId = toast.loading("로그아웃 중입니다...");

    startTransition(async () => {
      try {
        await logout();
        toast.dismiss(loadingToastId);
        router.push("/?auth=logged-out");
        router.refresh();
      } catch (error) {
        toast.dismiss(loadingToastId);

        console.error(error);

        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("로그아웃 중 오류가 발생했습니다.");
        }
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="nav-actions disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
