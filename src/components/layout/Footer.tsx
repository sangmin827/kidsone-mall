import Link from "next/link";

/**
 * 사이트 푸터.
 *
 * ⚠️ 사업자정보는 placeholder 로 두었습니다.
 *    이상민님이 직접 채워주세요. (TODO 주석 표시한 곳)
 *    전자상거래법상 아래 정보를 화면에 노출해야 합니다:
 *      - 상호 / 대표자 / 사업자등록번호 / 통신판매업 신고번호
 *      - 주소 / 전화번호 / 이메일
 *      - (선택) 호스팅 제공자
 */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* 좌측 — 브랜드 + 안내 링크 */}
          <div className="space-y-3">
            <p className="text-base font-bold text-gray-900">Kids One Mall</p>
            <p className="text-xs text-gray-500">
              아이들을 위한 전문 놀이도구 쇼핑몰
            </p>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <Link href="/terms" className="text-gray-600 hover:underline">
                이용약관
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/privacy"
                className="font-semibold text-gray-700 hover:underline"
              >
                개인정보처리방침
              </Link>
            </div>
            <p className="pt-2 text-[11px] text-gray-400">
              모든 결제는 무통장 입금으로 진행됩니다.
              <br /> 입금자명과 주문자명이 다를 경우 주문 처리가 지연될 수
              있습니다.
            </p>
          </div>

          {/* 가운데 — 사업자정보 (placeholder) */}
          <div className="space-y-1 text-xs leading-6 text-gray-600">
            <p className="text-sm font-semibold text-gray-800">사업자 정보</p>

            {/* TODO: 아래 값들은 사업자등록증 / 통신판매업 신고증을 받은 뒤 채워주세요. */}
            <p>
              상호 : <span className="text-gray-400">㈜Kids One</span>
            </p>
            <p>
              대표자 : <span className="text-gray-400">(대표자명 입력)</span>
            </p>
            <p>
              사업자등록번호 :{" "}
              <span className="text-gray-400">(000-00-00000)</span>
            </p>
            <p>
              통신판매업 신고번호 :{" "}
              <span className="text-gray-400">(제 0000-도시-0000호)</span>
            </p>
            <p>
              주소 :{" "}
              <span className="text-gray-400">
                광주 광역시 광산구 상무대로419번길 30-2, 3층{" "}
              </span>
            </p>
          </div>

          {/* 우측 — 연락처 (placeholder) */}
          <div className="space-y-1 text-xs leading-6 text-gray-600">
            <p className="text-sm font-semibold text-gray-800">고객센터</p>

            {/* TODO: 실제 연락처/운영시간 입력 */}
            <p>
              카카오톡 1:1 채팅 :{" "}
              <span className="text-gray-400">(카카오톡 아이디)</span>
            </p>
            <p>
              전화번호 :{" "}
              <span className="text-gray-400">(전화번호 입력란)</span>
            </p>
            <p>
              이메일 :{" "}
              <span className="text-gray-400">
                (contact@example.com)
                <br />
                &emsp; &emsp; &ensp; 이메일 확인이 늦어질수 있어 카카오톡 1:1
                상담을 부탁드립니다.
              </span>
            </p>
            <p>
              운영시간 :{" "}
              <span className="text-gray-400">
                평일 09:30 ~ 17:30 (점심 12:00 ~ 13:00 / 주말·공휴일 휴무)
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
          © {new Date().getFullYear()} Kids One Mall. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
