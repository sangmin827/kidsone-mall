"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function AuthToastBridge() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const auth = searchParams.get("auth");
    if (!auth) return;

    if (auth === "logged-in") {
      toast.success("로그인되었습니다.");
    }

    if (auth === "logged-out") {
      toast.success("로그아웃되었습니다.");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("auth");

    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams.toString()}`
      : pathname;

    router.replace(nextUrl);
  }, [searchParams, pathname, router]);

  return null;
}
