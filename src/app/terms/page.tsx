import Link from "next/link";

/**
 * 이용약관 페이지.
 *
 * ⚠️ 본 페이지의 내용은 일반 쇼핑몰 표준 템플릿 기반입니다.
 *    실제 시행 전 반드시 다음을 확인/수정 하세요:
 *      1. [회사명], [대표자명] 등 플레이스홀더 치환
 *      2. 배송비 / 환불 / 교환 정책이 자체 기준과 일치하는지
 *      3. 가능하면 변호사 검토를 거치는 것을 권장합니다.
 */

export const metadata = {
  title: "이용약관 | Kids One Mall",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900">이용약관</h1>
      <p className="mt-2 text-sm text-gray-500">
        시행일자 : <span className="text-gray-400">[YYYY-MM-DD]</span>
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제1조 (목적)
          </h2>
          <p>
            본 약관은 <span className="text-gray-400">[회사명]</span> (이하
            &lsquo;회사&rsquo;)가 운영하는 Kids One Mall (이하 &lsquo;몰&rsquo;)에서
            제공하는 인터넷 관련 서비스(이하 &lsquo;서비스&rsquo;)를 이용함에
            있어, 몰과 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로
            합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제2조 (정의)
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            <li>
              &lsquo;몰&rsquo;이란 회사가 재화 또는 용역을 이용자에게 제공하기
              위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수
              있도록 설정한 가상의 영업장을 말합니다.
            </li>
            <li>
              &lsquo;이용자&rsquo;란 &lsquo;몰&rsquo;에 접속하여 본 약관에 따라
              &lsquo;몰&rsquo;이 제공하는 서비스를 받는 회원 및 비회원을
              말합니다.
            </li>
            <li>
              &lsquo;회원&rsquo;이란 &lsquo;몰&rsquo;에 가입하여 계속적으로
              &lsquo;몰&rsquo;이 제공하는 서비스를 이용할 수 있는 자를 말합니다.
            </li>
            <li>
              &lsquo;비회원&rsquo;이란 회원에 가입하지 않고 &lsquo;몰&rsquo;이
              제공하는 서비스를 이용하는 자를 말합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제3조 (약관의 명시, 효력 및 개정)
          </h2>
          <p>
            회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록
            &lsquo;몰&rsquo;의 초기 서비스 화면(하단 푸터)에 게시합니다. 회사는
            「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법을 위배하지
            않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정
            사유를 명시하여 현행 약관과 함께 공지합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제4조 (회원가입)
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            <li>
              이용자는 몰이 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관 및
              개인정보처리방침에 동의한다는 의사표시를 함으로써 회원가입을
              신청합니다.
            </li>
            <li>
              <strong>
                만 14세 미만 아동은 본 서비스의 회원가입이 제한됩니다.
              </strong>{" "}
              회사는 가입 시 생년월일을 확인하여 만 14세 미만인 경우 가입을
              차단합니다.
            </li>
            <li>
              회사는 다음 각 호에 해당하는 신청에 대하여는 승낙하지 않을 수
              있습니다.
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>가입 신청자가 이전에 회원자격을 상실한 경우</li>
                <li>허위의 정보를 기재하거나 타인의 명의를 도용한 경우</li>
                <li>
                  그 밖에 회원으로 등록하는 것이 몰의 기술상 현저히 지장이 있다고
                  판단되는 경우
                </li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제5조 (결제 방법)
          </h2>
          <p>
            본 서비스의 결제 수단은 <strong>무통장 입금</strong> 단일 방식으로
            운영됩니다. 주문 완료 후 안내된 계좌로 입금이 확인되면 배송이
            진행됩니다. 입금자명과 주문자명이 다를 경우 주문 처리가 지연될 수
            있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제6조 (배송)
          </h2>
          <p>
            회사는 이용자가 구매한 재화에 대해 입금 확인 후 합리적인 기간 내에
            배송이 이루어지도록 합니다. 단, 재고 부족·품절·공급자 사유 등
            불가피한 경우 이용자에게 그 사유를 통지하고 환불 등의 조치를
            안내합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제7조 (청약철회 등)
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            <li>
              이용자는 재화를 수령한 날부터 7일 이내에 청약철회를 할 수 있습니다.
            </li>
            <li>
              이용자는 재화를 배송받은 경우 다음 각 호의 경우에는 청약철회가
              제한될 수 있습니다.
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  이용자의 책임 있는 사유로 재화가 멸실 또는 훼손된 경우
                </li>
                <li>이용자의 사용 또는 일부 소비로 재화의 가치가 현저히 감소한 경우</li>
                <li>
                  복제가 가능한 재화의 포장을 훼손한 경우
                </li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제8조 (환불)
          </h2>
          <p>
            회사는 이용자가 구매 신청한 재화가 품절 등의 사유로 인도할 수 없을 때,
            또는 정당한 청약철회 요청을 받은 때에는 지체 없이 그 사유를 이용자에게
            통지하고, 사전에 받은 대금의 전부 또는 일부를 환불합니다. 환불은
            이용자가 지정한 계좌로 영업일 기준 3일 이내에 처리됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제9조 (회원의 의무)
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>회원은 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
            <li>
              회원은 서비스 이용과 관련하여 법령, 본 약관의 규정, 이용안내 및
              서비스상에 공지한 주의사항 등을 준수해야 합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            제10조 (분쟁 해결)
          </h2>
          <p>
            회사와 이용자 간에 발생한 전자상거래 분쟁에 대해서는 이용자의 피해구제
            신청이 있을 경우 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의
            조정에 따를 수 있습니다.
          </p>
        </section>
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6 text-sm">
        <Link href="/" className="text-gray-500 hover:underline">
          ← 홈으로
        </Link>
        <Link href="/privacy" className="text-gray-500 hover:underline">
          개인정보처리방침 →
        </Link>
      </div>
    </main>
  );
}
