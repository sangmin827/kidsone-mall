import Link from "next/link";
import { KAKAO_CHANNEL_URL } from "@/src/constants/site";

/**
 * 사이트 푸터.
 * ⚠️ 사업자정보 placeholder — 이상민님이 직접 채워주세요.
 * ✏️ 카카오 채널 URL 변경은 src/constants/site.ts 에서 하세요.
 */

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-[#E8E6E1] bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid gap-8 md:grid-cols-3">

          {/* 브랜드 */}
          <div className="space-y-3">
            <p className="text-base font-bold text-[#222222]">Kids One Mall</p>
            <p className="text-xs text-[#6b7280] leading-5">
              아이들을 위한 전문 놀이도구 쇼핑몰
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <Link href="/terms" className="text-[#6b7280] hover:text-[#5332C9] transition-colors">
                이용약관
              </Link>
              <span className="text-[#E8E6E1]">|</span>
              <Link href="/privacy" className="font-semibold text-[#222222] hover:text-[#5332C9] transition-colors">
                개인정보처리방침
              </Link>
              <span className="text-[#E8E6E1]">|</span>
              <Link href="/refund" className="text-[#6b7280] hover:text-[#5332C9] transition-colors">
                환불/교환 정책
              </Link>
            </div>
            <p className="pt-1 text-[11px] leading-5 text-[#9ca3af]">
              모든 결제는 무통장 입금으로 진행됩니다.<br />
              입금자명과 주문자명이 다를 경우 처리가 지연될 수 있습니다.
            </p>
          </div>

          {/* 사업자정보 */}
          <div className="space-y-1 text-xs leading-6 text-[#6b7280]">
            <p className="mb-2 text-sm font-semibold text-[#222222]">사업자 정보</p>
            {/* TODO: 사업자등록증 수령 후 아래 내용을 채워주세요 */}
            <p>상호 : <span className="text-[#9ca3af]">㈜Kids One</span></p>
            <p>대표자 : <span className="text-[#9ca3af]">(대표자명 입력)</span></p>
            <p>사업자등록번호 : <span className="text-[#9ca3af]">(000-00-00000)</span></p>
            <p>통신판매업 신고번호 : <span className="text-[#9ca3af]">(제 0000-도시-0000호)</span></p>
            <p>주소 : <span className="text-[#9ca3af]">광주 광역시 광산구 상무대로419번길 30-2, 3층</span></p>
          </div>

          {/* 고객센터 */}
          <div className="space-y-2 text-xs leading-6 text-[#6b7280]">
            <p className="mb-1 text-sm font-semibold text-[#222222]">고객센터</p>

            {/* 카카오 채널 버튼 */}
            <a
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#FEE500] px-4 py-2.5 text-xs font-bold text-[#3C1E1E] transition-opacity hover:opacity-90"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 5.92 2 10.8c0 3.09 1.73 5.8 4.37 7.43-.19.68-.69 2.46-.79 2.85-.13.48.18.47.38.34.16-.1 2.53-1.72 3.56-2.42.81.12 1.63.18 2.48.18 5.52 0 10-3.92 10-8.8C22 5.92 17.52 2 12 2z"/>
              </svg>
              카카오톡 1:1 문의
            </a>

            <p>전화번호 : <span className="text-[#9ca3af]">(전화번호 입력)</span></p>
            <p>이메일 : <span className="text-[#9ca3af]">(contact@example.com)</span></p>
            <p className="text-[#9ca3af]">
              운영시간 : 평일 09:30 ~ 17:30<br />
              (점심 12:00 ~ 13:00 / 주말·공휴일 휴무)
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E8E6E1] pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-[#9ca3af]">
            © {new Date().getFullYear()} Kids One Mall. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#9ca3af]">Hosted with</span>
            <span className="text-xs text-[#FF5555]">♥</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
