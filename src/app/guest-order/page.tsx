import GuestOrderLookupForm from "@/src/components/guest-order/GuestOrderLookupForm";

export default function GuestOrderPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">비회원 주문조회</h1>
        <p className="mt-2 text-sm text-gray-600">
          주문번호와 주문자 연락처를 입력해주세요.
        </p>

        <div className="mt-6">
          <GuestOrderLookupForm />
        </div>
      </div>
    </main>
  );
}
