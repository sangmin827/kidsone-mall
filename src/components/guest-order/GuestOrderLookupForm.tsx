"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

export default function GuestOrderLookupForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedOrderNumber = orderNumber.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedOrderNumber || !trimmedPhone) {
      return;
    }

    router.push(
      `/guest-order/result?orderNumber=${encodeURIComponent(trimmedOrderNumber)}&phone=${encodeURIComponent(trimmedPhone)}`,
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="주문번호"
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
      />

      <input
        type="tel"
        inputMode="numeric"
        maxLength={13}
        value={phone}
        onChange={(e) => setPhone(formatPhone(e.target.value))}
        placeholder="주문자 연락처 (010-1234-5678)"
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
      />

      <button
        type="submit"
        className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
      >
        비회원 주문조회
      </button>
    </form>
  );
}
