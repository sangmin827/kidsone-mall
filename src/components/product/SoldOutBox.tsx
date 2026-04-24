"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { submitPurchaseRequest } from "@/src/server/purchase-requests";

type Props = {
  productId: number;
};

export default function SoldOutBox({ productId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/;

  const reset = () => {
    setName("");
    setPhone("");
    setAgreed(false);
    setIsDetailOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    reset();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (!phone.trim()) {
      toast.error("연락처를 입력해주세요.");
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      toast.error("연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)");
      return;
    }
    if (!agreed) {
      toast.error("개인정보 수집·이용에 동의해주세요.");
      return;
    }

    const formData = new FormData();
    formData.set("product_id", String(productId));
    formData.set("customer_name", name.trim());
    formData.set("customer_phone", phone.trim());
    formData.set("privacy_agreed", "on");

    startTransition(async () => {
      const result = await submitPurchaseRequest(formData);
      if (result.ok) {
        toast.success(result.message);
        handleClose();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
      <div className="space-y-3 text-center">
        <p className="text-base font-semibold text-rose-700">
          현재 품절된 상품입니다.
        </p>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
        >
          구매 희망
        </button>

        <p className="text-xs text-rose-700">
          차후 재구매 가능 시 안내 도와드리겠습니다.
        </p>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              구매 희망 신청
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              재입고 시 입력해주신 연락처로 안내드릴게요.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  required
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  연락처
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="010-1234-5678"
                  required
                  inputMode="numeric"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="leading-5 text-gray-700">
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen((prev) => !prev)}
                      className="font-semibold text-blue-600 underline"
                    >
                      개인정보 수집·이용
                    </button>
                    에 동의합니다. (필수)
                  </span>
                </label>

                {isDetailOpen && (
                  <div className="mt-3 space-y-2 rounded-lg bg-white p-3 text-[11px] leading-5 text-gray-600">
                    <p>
                      <strong>· 수집 항목</strong> : 이름, 연락처
                    </p>
                    <p>
                      <strong>· 수집·이용 목적</strong> : 품절 상품 재입고 시
                      안내 메시지 발송
                    </p>
                    <p>
                      <strong>· 보유·이용 기간</strong> : 처리 완료 (안내
                      발송 또는 취소) 후 즉시 파기
                    </p>
                    <p>
                      <strong>· 동의 거부 권리</strong> : 동의를 거부하실 수
                      있으나, 동의하지 않을 경우 재입고 안내가 어렵습니다.
                    </p>
                    <p>
                      자세한 내용은{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        개인정보처리방침
                      </Link>
                      을 참고해주세요.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isPending ? "신청 중..." : "신청하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
