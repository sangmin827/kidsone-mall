import Link from "next/link";
import type { Metadata } from "next";
import { KAKAO_CHANNEL_URL } from "@/src/constants/site";

export const metadata: Metadata = {
  title: "환불/교환 정책 | Kids One Mall",
  description: "Kids One Mall 반품, 교환, 환불 정책 안내",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#E8E6E1]">
        <div className="section-inner py-6 sm:py-8">
          <h1 className="section-title">환불 / 교환 정책</h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            전자상거래 등에서의 소비자보호에 관한 법률에 의거한 반품·교환·환불
            정책입니다.
          </p>
        </div>
      </div>

      <div className="section-inner py-8 space-y-6 max-w-3xl">
        {/* 청약철회 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ede9fb] text-sm text-[#5332C9] font-bold">
              1
            </span>
            청약철회 (단순 변심 반품)
          </h2>
          <div className="mt-4 space-y-2 text-sm text-[#6b7280] leading-7">
            <p>
              상품 수령 후{" "}
              <span className="font-semibold text-[#222222]">7일 이내</span>에
              청약철회(단순 변심 반품)가 가능합니다. (전자상거래소비자보호법
              제17조)
            </p>
            <p>단, 아래의 경우 청약철회가 제한될 수 있습니다.</p>
            <ul className="space-y-1 pl-4">
              {[
                "상품의 포장을 개봉하여 사용·설치한 경우",
                "상품의 가치가 현저히 감소한 경우 (파손, 오염, 냄새 등)",
                "세트 구성품 중 일부만 반품하는 경우",
                "주문 제작 상품 또는 맞춤 제작 상품",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#9ca3af]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-xl bg-[#FAF9F6] border border-[#E8E6E1] px-4 py-3 text-xs text-[#6b7280]">
              <p className="font-semibold text-[#222222]">
                💡 반품 배송비 안내
              </p>
              <p className="mt-1">
                단순 변심에 의한 반품 시 왕복 배송비는 고객 부담입니다.
              </p>
            </div>
          </div>
        </section>

        {/* 교환/반품 불가 */}
        <section className="rounded-2xl border border-[#FF5555]/20 bg-[#fff0f0] p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#FF5555] flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF5555] text-sm text-white font-bold">
              2
            </span>
            교환·반품이 불가한 경우
          </h2>
          <ul className="mt-4 space-y-2">
            {[
              "상품 수령 후 7일이 경과한 경우",
              "고객의 사용·취급 부주의로 인한 파손/오염",
              "상품 포장 및 구성품 훼손 시",
              "주문 제작 상품 또는 재단·가공이 완료된 상품",
              "유통기한이 지났거나 위생 관련 상품 개봉 후",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-[#b91c1c]"
              >
                <span className="mt-0.5">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 불량/오배송 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ede9fb] text-sm text-[#5332C9] font-bold">
              3
            </span>
            불량품 / 오배송 처리
          </h2>
          <div className="mt-4 space-y-2 text-sm text-[#6b7280] leading-7">
            <p>
              상품의{" "}
              <span className="font-semibold text-[#222222]">
                제조 불량, 파손, 오배송
              </span>
              의 경우 수령 후{" "}
              <span className="font-semibold text-[#222222]">14일 이내</span>에
              카카오톡 채널로 문의해 주세요.
            </p>
            <p>
              불량/오배송 확인 시{" "}
              <span className="font-semibold text-[#222222]">
                왕복 배송비는 판매자 부담
              </span>
              으로 처리해 드립니다.
            </p>
            <p className="text-xs text-[#9ca3af]">
              * 문의 시 주문번호, 상품명, 불량 부위 사진을 함께 보내주시면 빠른
              처리가 가능합니다.
            </p>
          </div>
        </section>

        {/* 환불 절차 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ede9fb] text-sm text-[#5332C9] font-bold">
              4
            </span>
            환불 절차 및 기간
          </h2>
          <div className="mt-4 space-y-3">
            {[
              {
                step: "01",
                title: "반품 접수",
                desc: "마이페이지에서 상품의 반품요청을 해주세요. (사유를 꼭 적어주세요)",
              },
              {
                step: "02",
                title: "상품 회수",
                desc: "반품 주소 안내 후 상품을 발송해 주세요.",
              },
              {
                step: "03",
                title: "상품 검수",
                desc: "반품 상품 수령 및 상태 확인 (1~2 영업일).",
              },
              {
                step: "04",
                title: "환불 처리",
                desc: "무통장입금은 고객 계좌로 환불 (검수 완료 후 3 영업일 이내).",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-[#5332C9] text-xs font-bold text-white">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#222222]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#6b7280] leading-5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 배송비 정책 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-6 sm:p-8">
          <h2 className="text-base font-bold text-[#222222] flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ede9fb] text-sm text-[#5332C9] font-bold">
              5
            </span>
            배송비 부담 기준
          </h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-[#E8E6E1]">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#E8E6E1]">
                  <th className="px-4 py-3 text-left font-semibold text-[#222222]">
                    사유
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-[#222222]">
                    배송비 부담
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6E1] text-[#6b7280]">
                <tr>
                  <td className="px-4 py-3">단순 변심 반품</td>
                  <td className="px-4 py-3 text-center font-medium text-[#FF5555]">
                    고객 부담
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">제품 불량 / 오배송</td>
                  <td className="px-4 py-3 text-center font-medium text-[#22c55e]">
                    판매자 부담
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">교환 요청 (단순 변심)</td>
                  <td className="px-4 py-3 text-center font-medium text-[#FF5555]">
                    고객 부담
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 문의 CTA */}
        <section className="rounded-2xl bg-[#5332C9] px-6 py-8 text-center">
          <p className="text-sm font-bold text-white">
            반품·교환 문의는 카카오톡으로 편하게!
          </p>
          <p className="mt-1 text-xs text-[#c4b9f5]">
            운영시간 내 빠르게 답변드립니다.
          </p>
          {/* ↓ 아래 href를 실제 카카오 채널 URL로 교체해 주세요 */}
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FEE500] px-6 py-3 text-sm font-bold text-[#3C1E1E] transition-opacity hover:opacity-90"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.09 1.73 5.8 4.37 7.43-.19.68-.69 2.46-.79 2.85-.13.48.18.47.38.34.16-.1 2.53-1.72 3.56-2.42.81.12 1.63.18 2.48.18 5.52 0 10-3.92 10-8.8C22 5.92 17.52 2 12 2z" />
            </svg>
            카카오톡 1:1 문의하기
          </a>
        </section>

        <div className="pb-4">
          <Link href="/" className="btn-ghost inline-flex gap-2 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
