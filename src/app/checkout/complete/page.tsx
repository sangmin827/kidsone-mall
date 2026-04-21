import Link from "next/link";
import { getActiveBankAccounts } from "@/src/server/checkout";
import { KAKAO_CHANNEL_URL } from "@/src/constants/site";

export const metadata = {
  title: "주문 완료 | Kids One Mall",
};

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;
  const bankAccounts = await getActiveBankAccounts();

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

        {/* 완료 카드 */}
        <div className="rounded-3xl border border-[#E8E6E1] bg-white p-8 shadow-sm">

          {/* 체크 아이콘 */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ede9fb]">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
                fill="none" stroke="#5332C9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-[#222222]">주문이 완료되었습니다!</h1>
            <p className="mt-2 text-sm text-[#6b7280]">
              아래 계좌로 <span className="font-semibold text-[#222222]">24시간 이내</span>에 입금해 주시면 주문이 확정됩니다.
            </p>
          </div>

          {/* 주문번호 */}
          {orderNumber && (
            <div className="mt-6 rounded-2xl bg-[#ede9fb] px-5 py-4 text-center">
              <p className="text-xs font-medium text-[#5332C9]">주문번호</p>
              <p className="mt-1 text-lg font-bold tracking-wide text-[#222222]">{orderNumber}</p>
            </div>
          )}

          {/* 입금 계좌 정보 */}
          <div className="mt-6">
            <h2 className="text-sm font-bold text-[#222222]">📌 입금 계좌 정보</h2>
            {bankAccounts.length === 0 ? (
              <div className="mt-3 rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3 text-sm text-[#6b7280]">
                계좌 정보를 불러올 수 없습니다. 고객센터로 문의해 주세요.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#222222]">{account.bank_name}</span>
                      <span className="text-[#5332C9] font-bold">{account.account_number}</span>
                    </div>
                    <p className="mt-1 text-[#6b7280]">예금주: {account.account_holder}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 주의사항 */}
          <div className="mt-5 rounded-2xl border border-[#FF5555]/20 bg-[#fff0f0] px-5 py-4 space-y-2">
            <p className="text-xs font-bold text-[#FF5555]">⚠️ 입금 전 꼭 확인해 주세요</p>
            {[
              "입금자명은 주문 시 입력하신 입금자명과 동일하게 입력해 주세요.",
              "입금 기한은 주문 후 24시간이며, 기한 내 미입금 시 주문이 자동으로 취소됩니다.",
              "입금 확인 후 배송이 준비되며, 배송까지 1~2주 정도 소요될 수 있습니다.",
              "입금자명 오기입 또는 분할 입금 시 처리가 지연될 수 있습니다.",
            ].map((notice) => (
              <p key={notice} className="text-xs leading-5 text-[#b91c1c]">• {notice}</p>
            ))}
          </div>

          {/* 문의 안내 */}
          <div className="mt-5 rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] px-5 py-4">
            <p className="text-xs font-semibold text-[#222222]">💬 문의가 있으신가요?</p>
            <p className="mt-1 text-xs text-[#6b7280]">
              카카오톡 채널로 문의해 주시면 빠르게 도와드릴게요.
            </p>
            <a
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#FEE500] px-4 py-2.5 text-xs font-bold text-[#3C1E1E] transition-opacity hover:opacity-90"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.09 1.73 5.8 4.37 7.43-.19.68-.69 2.46-.79 2.85-.13.48.18.47.38.34.16-.1 2.53-1.72 3.56-2.42.81.12 1.63.18 2.48.18 5.52 0 10-3.92 10-8.8C22 5.92 17.52 2 12 2z"/>
              </svg>
              카카오톡으로 문의하기
            </a>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/mypage/orders"
              className="flex-1 rounded-xl bg-[#5332C9] px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#4427b0]"
            >
              주문내역 확인하기
            </Link>
            <Link
              href="/products"
              className="flex-1 rounded-xl border border-[#E8E6E1] bg-white px-4 py-3 text-center text-sm font-medium text-[#222222] transition-colors hover:bg-[#FAF9F6]"
            >
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
