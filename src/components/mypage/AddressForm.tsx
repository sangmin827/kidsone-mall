"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createMyAddress } from "@/src/server/addresses";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "저장 중..." : "배송지 추가"}
    </button>
  );
}

export default function AddressForm() {
  const [postalCode, setPostalCode] = useState("");
  const [addressMain, setAddressMain] = useState("");
  const detailAddressRef = useRef<HTMLInputElement>(null);

  const handleSearchAddress = () => {
    if (!window.kakao?.Postcode) {
      alert("주소 검색 서비스를 불러오지 못했습니다.");
      return;
    }

    new window.kakao.Postcode({
      oncomplete: (data) => {
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

        setPostalCode(data.zonecode);
        setAddressMain(addr);

        setTimeout(() => {
          detailAddressRef.current?.focus();
        }, 0);
      },
    }).open();
  };

  return (
    <form
      action={createMyAddress}
      className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-lg font-bold">배송지 추가</h2>

      <input
        name="recipient_name"
        placeholder="수령자 이름"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />

      <input
        name="recipient_phone"
        placeholder="수령자 연락처"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />

      <div className="flex gap-2">
        <input
          name="postal_code"
          value={postalCode}
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
        name="address_main"
        value={addressMain}
        readOnly
        placeholder="기본 주소"
        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
      />

      <input
        ref={detailAddressRef}
        name="address_detail"
        placeholder="상세 주소"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />

      <input
        name="memo"
        placeholder="비고사항"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />

      <SubmitButton />
    </form>
  );
}
