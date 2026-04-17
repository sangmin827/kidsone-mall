import Link from "next/link";

/**
 * 개인정보처리방침 페이지.
 *
 * ⚠️ 본 페이지의 내용은 일반 쇼핑몰에 흔히 사용되는 표준 템플릿 기반입니다.
 *    실제 시행 전에 다음을 반드시 확인/수정 하세요:
 *      1. 사업자명 / 대표자명 / 연락처 (본 파일의 [회사명], [이메일], [전화번호] 표시 부분)
 *      2. 수집하는 항목이 본 사이트 실제 동작과 일치하는지
 *      3. 보유·이용 기간이 자체 정책과 일치하는지
 *      4. 외부 제공/위탁 업체가 추가될 경우 (PG, 택배사, 알림톡 등) 해당 섹션 갱신
 *      5. 개인정보 보호책임자 지정 (이상민님 본인 또는 대리인)
 *
 *    가능하면 변호사/노무사 검토를 거치는 것을 권장합니다.
 *    본 템플릿은 법적 자문을 대신하지 않습니다.
 */

export const metadata = {
  title: "개인정보처리방침 | Kids One Mall",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-gray-500">
        시행일자 : <span className="text-gray-400">[YYYY-MM-DD]</span>
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            1. 총칙
          </h2>
          <p>
            <span className="text-gray-400">[회사명]</span> (이하 &lsquo;회사&rsquo;)는
            정보주체의 자유와 권리를 보호하기 위해 「개인정보 보호법」 및 관계
            법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게
            관리하고 있습니다. 이에 「개인정보 보호법」 제30조에 따라 정보주체에게
            개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을
            신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보
            처리방침을 수립·공개합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            2. 수집하는 개인정보 항목 및 수집 방법
          </h2>
          <p>회사는 다음의 개인정보 항목을 수집·이용하고 있습니다.</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              <strong>회원가입 시 (소셜 로그인)</strong> : 이메일, 이름(닉네임),
              생년월일, 소셜 로그인 제공자(Google/Kakao) 식별자
            </li>
            <li>
              <strong>주문/배송 시</strong> : 주문자명, 수령인명, 연락처,
              배송지 주소, 입금자명
            </li>
            <li>
              <strong>비회원 주문 시</strong> : 주문자명, 연락처, 비밀번호 (주문
              조회용)
            </li>
            <li>
              <strong>구매 희망(품절 알림) 신청 시</strong> : 이름, 연락처
            </li>
            <li>
              <strong>자동 수집 항목</strong> : 접속 로그, 쿠키, 접속 IP,
              서비스 이용 기록
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            3. 개인정보의 처리 목적
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>회원 가입 및 본인 확인</li>
            <li>상품 주문, 결제(무통장 입금) 및 배송</li>
            <li>주문 조회, 취소, 환불 등 고객 응대</li>
            <li>서비스 부정 이용 방지</li>
            <li>품절 상품 재입고 시 안내</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            4. 개인정보의 처리 및 보유 기간
          </h2>
          <p>
            회사는 개인정보 수집 시에 동의받은 개인정보 보유·이용 기간 또는
            법령에 따른 보유·이용 기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>회원 정보 : 회원 탈퇴 시까지</li>
            <li>
              계약 또는 청약철회, 대금결제 및 재화 등의 공급에 관한 기록 : 5년
              (전자상거래법)
            </li>
            <li>소비자의 불만 또는 분쟁처리에 관한 기록 : 3년</li>
            <li>접속 기록 : 3개월 (통신비밀보호법)</li>
            <li>구매 희망 신청 정보 : 처리 완료(안내 발송 또는 거절) 후 즉시 파기</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            5. 개인정보의 제3자 제공
          </h2>
          <p>
            회사는 정보주체의 별도 동의, 법률의 특별한 규정 등 「개인정보
            보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게
            제공합니다.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            ※ 현재 외부 제공 위탁 업체가 추가될 경우 본 섹션을 갱신합니다.
            (예: 택배사, 알림 발송 업체 등)
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            6. 개인정보처리의 위탁
          </h2>
          <p>
            회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
            처리업무를 위탁하고 있습니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              인프라 호스팅 / 데이터베이스 운영 : Supabase, Vercel
            </li>
            <li>
              소셜 로그인 인증 : Google LLC, Kakao Corp.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            7. 만 14세 미만 아동의 개인정보 처리
          </h2>
          <p>
            회사는 만 14세 미만 아동의 회원가입을 받지 않습니다. 회원가입 시
            생년월일을 입력받아 만 14세 미만으로 확인되는 경우 가입을
            제한합니다. 만약 만 14세 미만 아동의 개인정보가 수집된 사실을 인지한
            경우 즉시 해당 정보를 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            8. 정보주체의 권리·의무 및 행사 방법
          </h2>
          <p>
            정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지
            요구 등의 권리를 행사할 수 있습니다. 권리 행사는 마이페이지 또는
            아래 고객센터를 통해 신청하실 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            9. 개인정보의 안전성 확보 조치
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>HTTPS 전구간 암호화 통신</li>
            <li>접근 권한 분리 (관리자 / 일반 사용자)</li>
            <li>관리자 페이지 다중 인증 (Basic Auth + 관리자 계정 검증)</li>
            <li>개인정보 처리 시스템 접근 기록 보관</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            10. 개인정보 보호책임자
          </h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
            관련한 정보주체의 불만 처리 및 피해 구제 등을 위하여 아래와 같이
            개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
            <li>
              성명 : <span className="text-gray-400">[성명 입력]</span>
            </li>
            <li>
              연락처 : <span className="text-gray-400">[전화번호 입력]</span>
            </li>
            <li>
              이메일 : <span className="text-gray-400">[이메일 입력]</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            11. 개인정보처리방침의 변경
          </h2>
          <p>
            본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의
            추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 사이트
            공지사항을 통하여 고지합니다.
          </p>
        </section>
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6 text-sm">
        <Link href="/" className="text-gray-500 hover:underline">
          ← 홈으로
        </Link>
        <Link href="/terms" className="text-gray-500 hover:underline">
          이용약관 →
        </Link>
      </div>
    </main>
  );
}
