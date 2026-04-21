import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소비자보호법 안내 | Kids One Mall",
  description: "전자상거래 소비자보호법 및 유아용품 반품·교환 기준 안내",
};

export default function ConsumerProtectionPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* 헤더 */}
        <div>
          <Link
            href="/mypage/orders"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-[#5332C9] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            주문 내역으로 돌아가기
          </Link>
          <h1 className="text-2xl font-black text-[#222222]">
            소비자보호법 안내
          </h1>
          <p className="mt-1 text-sm text-[#6b7280]">
            전자상거래 등에서의 소비자보호에 관한 법률(전소법) 기반 반품·교환
            권리 안내
          </p>
        </div>

        {/* 청약철회권 (7일) */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#222222]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fb] text-xs font-black text-[#5332C9]">
              1
            </span>
            청약철회권 (7일 이내 반품)
          </h2>
          <p className="text-sm leading-relaxed text-[#6b7280]">
            전자상거래법 제17조에 따라, 소비자는 상품을 받은 날로부터{" "}
            <strong className="text-[#222222]">7일 이내</strong>에 특별한 이유
            없이 청약(구매)을 철회하고 반품을 요청할 수 있습니다.
          </p>
          <div className="rounded-xl bg-[#ede9fb] px-4 py-3">
            <p className="text-xs font-semibold text-[#5332C9]">
              📌 반품 신청 절차
            </p>
            <ol className="mt-2 space-y-1 text-xs text-[#5332C9]">
              <li>1. 마이페이지 → 주문 내역 → 반품 신청</li>
              <li>2. 반품 사유 및 상품 선택</li>
              <li>3. 반품 접수 확인 후 상품 발송</li>
              <li>4. 상품 수거 및 검수 완료 후 환불 처리</li>
            </ol>
          </div>
        </section>

        {/* 반품 불가 항목 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#222222]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-xs font-black text-[#FF5555]">
              2
            </span>
            반품이 불가한 경우 (법 제17조 2항)
          </h2>
          <p className="text-sm text-[#6b7280]">
            아래 경우에는 소비자보호법에 따라 청약철회가 제한될 수 있습니다.
          </p>
          <ul className="space-y-2">
            {[
              {
                icon: "📦",
                text: "상품을 개봉하거나 사용하여 재판매가 어려워진 경우",
              },
              {
                icon: "🧸",
                text: "유아용품 특성상 위생·안전 포장이 훼손된 경우",
              },
              { icon: "⏰", text: "배송 완료 후 7일이 경과한 경우" },
              {
                icon: "🏷️",
                text: "상품 택(tag), 포장재가 제거되거나 손상된 경우",
              },
              {
                icon: "🎁",
                text: "소비자의 주문에 따라 특별 제작된 맞춤형 상품",
              },
              {
                icon: "📉",
                text: "시간 경과로 재판매가 불가능하거나 현저히 가치가 감소한 상품",
              },
              {
                icon: "🖥️",
                text: "복제 가능한 디지털 콘텐츠가 포함된 상품 (개봉 후)",
              },
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-3 py-2.5"
              >
                <span className="flex-none text-base">{item.icon}</span>
                <span className="text-sm text-[#6b7280]">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 유아용품 특별 기준 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#222222]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fef9ec] text-xs font-black text-[#D4AF37]">
              3
            </span>
            유아용품 반품·교환 세부 기준
          </h2>
          <p className="text-sm text-[#6b7280]">
            Kids One Mall은 유아 및 어린이 안전을 최우선으로 합니다.
          </p>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3">
              <p className="text-xs font-bold text-[#15803d] mb-1.5">
                ✅ 반품 가능한 경우
              </p>
              <ul className="space-y-1 text-xs text-[#15803d]">
                <li>• 배송 완료 후 7일 이내, 미개봉·미사용 상품</li>
                <li>• 상품 불량 또는 오배송 (배송 완료일 기준 14일 이내)</li>
                <li>• 상품 설명과 실제 상품이 현저히 다른 경우</li>
                <li>• 안전 검증 불합격 등 품질 기준 미달 상품</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#fecaca] bg-[#fff5f5] p-3">
              <p className="text-xs font-bold text-[#FF5555] mb-1.5">
                ❌ 유아용품 반품 불가 사례
              </p>
              <ul className="space-y-1 text-xs text-[#FF5555]">
                <li>• 아이가 사용한 흔적이 있는 장난감·완구</li>
                <li>• 커스터마이징된 이름 각인, 자수 등 특주 상품</li>
                <li>• 세트 상품 중 일부만 개봉·사용한 경우</li>
                <li>• 반품 신청 없이 임의로 발송된 상품</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 반품 배송비 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#222222]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-[#c2410c]">
              4
            </span>
            반품 배송비 안내
          </h2>
          <div className="space-y-2 text-sm text-[#6b7280]">
            <div className="flex items-center justify-between rounded-xl border border-[#E8E6E1] bg-[#FAF9F6] px-4 py-2.5">
              <span>단순 변심 반품 (왕복)</span>
              <span className="font-bold text-[#222222]">별도 고지 금액</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2.5">
              <span className="text-[#15803d]">상품 불량 / 오배송</span>
              <span className="font-bold text-[#15803d]">
                판매자 부담 (무료)
              </span>
            </div>
          </div>
          <p className="text-xs text-[#9ca3af]">
            * 반품 배송비는 반품 신청 시 안내된 금액을 기준으로 합니다.
            불량·오배송의 경우 반드시 사진과 함께 문의 주세요.
          </p>
        </section>

        {/* 환불 처리 일정 */}
        <section className="rounded-2xl border border-[#E8E6E1] bg-white p-5 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#222222]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ede9fb] text-xs font-black text-[#5332C9]">
              5
            </span>
            환불 처리 일정
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex-none rounded-full bg-[#ede9fb] px-2 py-0.5 text-[10px] font-bold text-[#5332C9]">
                무통장
              </span>
              <span className="text-[#6b7280]">
                상품 수거 및 검수 완료 후{" "}
                <strong className="text-[#222222]">영업일 3~5일</strong> 이내
                계좌 환불
              </span>
            </div>
          </div>
          <p className="text-xs text-[#9ca3af]">
            * 반품 검수 과정에서 불량 여부 및 반품 가능 조건을 확인합니다. 조건
            불충족 시 반품이 거절될 수 있으며, 이 경우 고객센터에서 별도
            안내드립니다.
          </p>
        </section>

        {/* 법적 근거 */}
        <div className="rounded-2xl border border-[#E8E6E1] bg-[#FAF9F6] px-5 py-4">
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            본 안내는{" "}
            <strong>
              전자상거래 등에서의 소비자보호에 관한 법률(법률 제19199호)
            </strong>{" "}
            및 공정거래위원회 표준약관을 기반으로 작성되었습니다. 법률 변경 시
            내용이 업데이트될 수 있으며, 자세한 내용은 고객센터로 문의해 주세요.
          </p>
        </div>

        {/* 돌아가기 버튼 */}
        <div className="pb-8 text-center">
          <Link
            href="/mypage/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-[#5332C9] px-6 py-3 text-sm font-bold text-white hover:bg-[#4427b0] transition-colors"
          >
            주문 내역으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
