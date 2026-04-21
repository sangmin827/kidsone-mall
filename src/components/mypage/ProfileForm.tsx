// src/components/mypage/ProfileForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { MyProfile } from "@/src/server/mypage";
import { updateMyProfile } from "@/src/server/mypage";

type Props = {
  profile: MyProfile;
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ProfileForm({ profile }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneValue, setPhoneValue] = useState(
    formatPhone(profile.phone ?? ""),
  );
  const delayToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (delayToastTimerRef.current) {
        clearTimeout(delayToastTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);

    try {
      setIsSubmitting(true);

      if (delayToastTimerRef.current) {
        clearTimeout(delayToastTimerRef.current);
      }
      delayToastTimerRef.current = setTimeout(() => {
        toast.loading("저장 중입니다...", {
          id: "profile-update",
          duration: 2000,
        });
      }, 1000);

      await updateMyProfile(formData);

      if (delayToastTimerRef.current) {
        clearTimeout(delayToastTimerRef.current);
        delayToastTimerRef.current = null;
      }

      toast.success("내 정보가 저장되었습니다.", {
        id: "profile-update",
        duration: 1500,
      });
    } catch (error) {
      if (delayToastTimerRef.current) {
        clearTimeout(delayToastTimerRef.current);
        delayToastTimerRef.current = null;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "내 정보 저장 중 오류가 발생했습니다.",
        { id: "profile-update", duration: 2500 },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <div>
        <h2 className="text-lg font-bold">내 정보 수정</h2>
        <p className="mt-1 text-sm text-gray-500">
          주문자 이름과 연락처를 수정할 수 있습니다.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            이메일
          </label>
          <input
            id="email"
            value={profile.email}
            disabled
            className="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            주문자 이름
          </label>
          <input
            id="name"
            name="name"
            defaultValue={profile.name ?? ""}
            placeholder="이름을 입력하세요"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            주문자 연락처
          </label>
          <input
            id="phone"
            name="phone"
            value={phoneValue}
            onChange={(e) => setPhoneValue(formatPhone(e.target.value))}
            placeholder="010-1234-5678"
            inputMode="tel"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "저장 중..." : "저장하기"}
      </button>
    </form>
  );
}
