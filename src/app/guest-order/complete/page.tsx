export default async function GuestOrderCompletePage({
  searchParams,
}: {
  searchParams: Promise<{
    orderNumber?: string;
    phone?: string;
  }>;
}) {
  const { orderNumber, phone } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">비회원 주문이 완료되었습니다</h1>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm">
          <p>
            <span className="font-semibold">주문번호:</span>{" "}
            {orderNumber ?? "-"}
          </p>
          <p className="mt-2">
            <span className="font-semibold">주문자 연락처:</span> {phone ?? "-"}
          </p>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          주문번호와 주문자 연락처로 비회원 주문조회가 가능합니다.
        </p>

        <a
          href="/guest-order"
          className="mt-6 inline-block rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
        >
          비회원 주문조회 하러가기
        </a>
      </div>
    </main>
  );
}
