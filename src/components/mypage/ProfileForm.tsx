// src/components/mypage/ProfileForm.tsx
"use client";

import { useFormStatus } from "react-dom";
import type { MyProfile } from "@/src/server/mypage";
import { updateMyProfile } from "@/src/server/mypage";

type Props = {
  profile: MyProfile;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "저장 중..." : "저장하기"}
    </button>
  );
}

export default function ProfileForm({ profile }: Props) {
  return (
    <form
      action={updateMyProfile}
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
            defaultValue={profile.phone ?? ""}
            placeholder="연락처를 입력하세요"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
