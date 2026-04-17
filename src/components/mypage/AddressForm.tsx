"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createMyAddress } from "@/src/server/addresses";

export default function AddressForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const detailAddressRef = useRef<HTMLInputElement>(null);
  const delayToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [postalCode, setPostalCode] = useState("");
  const [addressMain, setAddressMain] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientPhoneExtra, setRecipientPhoneExtra] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (delayToastTimerRef.current) {
        clearTimeout(delayToastTimerRef.current);
      }
    };
  }, []);

  // 휴대폰 입력을 010-1234-5678 형식으로 자동 포맷
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  };

  const handleSearchAddress = () => {
    if (!window.kakao?.Postcode) {
      toast.error("주소 검색 서비스를 불러오지 못했습니다.");
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);

    const recipientName = String(formData.get("recipient_name") ?? "").trim();
    const recipientPhoneValue = recipientPhone.trim();
    const recipientPhoneExtraValue = recipientPhoneExtra.trim();
    const postalCodeValue = String(formData.get("postal_code") ?? "").trim();
    const addressMainValue = String(formData.get("address_main") ?? "").trim();
    const addressDetail = String(formData.get("address_detail") ?? "").trim();

    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;

    if (!recipientName) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    if (!recipientPhoneValue) {
      toast.error("연락처 1은 필수입니다.");
      return;
    }

    if (!phoneRegex.test(recipientPhoneValue)) {
      toast.error("연락처 1은 010-1234-5678 형식으로 입력해주세요.");
      return;
    }

    if (recipientPhoneExtraValue && !phoneRegex.test(recipientPhoneExtraValue)) {
      toast.error("연락처 2는 010-1234-5678 형식으로 입력해주세요.");
      return;
    }

    // FormData 에도 포맷된 값 반영
    formData.set("recipient_phone", recipientPhoneValue);
    formData.set("recipient_phone_extra", recipientPhoneExtraValue);

    if (!postalCodeValue) {
      toast.error("우편번호를 입력해주세요.");
      return;
    }

    if (!addressMainValue) {
      toast.error("기본 주소를 입력해주세요.");
      return;
    }

    if (!addressDetail) {
      toast.error("상세 주소를 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1초 넘게 걸리면 "처리 중" 안내 토스트
      if (delayToastTimerRef.current) {
        clearTimeout(delayToastTimerRef.current);
      }
      delayToastTimerRef.current = setTimeout(() => {
        toast.loading("배송지 추가 처리 중입니다...", {
          id: "address-create",
          duration: 2000,
        });
      }, 1000);

      await createMyAddress(formData);

      if (delayToastTimerRef.current) {
        clearTimeout(delayToastTimerRef.current);
        delayToastTimerRef.current = null;
      }

      formRef.current?.reset();
      setPostalCode("");
      setAddressMain("");
      setRecipientPhone("");
      setRecipientPhoneExtra("");

      toast.success("배송지가 추가되었습니다.", {
        id: "address-create",
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
          : "배송지 추가 중 오류가 발생했습니다.",
        {
          id: "address-create",
          duration: 2500,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
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
        type="tel"
        inputMode="numeric"
        maxLength={13}
        placeholder="수령자 연락처 1 (010-1234-5678) *필수"
        value={recipientPhone}
        onChange={(e) => setRecipientPhone(formatPhone(e.target.value))}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />

      <input
        name="recipient_phone_extra"
        type="tel"
        inputMode="numeric"
        maxLength={13}
        placeholder="수령자 연락처 2 (010-1234-5678) *선택"
        value={recipientPhoneExtra}
        onChange={(e) => setRecipientPhoneExtra(formatPhone(e.target.value))}
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
        placeholder='상세 주소 (동, 호수가 없는 주택은 "주택"으로 남겨주세요)'
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />

      <input
        name="memo"
        placeholder="배송 메시지 or 기타사항"
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "저장 중..." : "배송지 추가"}
      </button>
    </form>
  );
}
