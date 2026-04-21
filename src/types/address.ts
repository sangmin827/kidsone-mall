/**
 * 주소 관련 공유 타입
 *
 * 클라이언트(CheckoutClient)와 서버(addresses.ts, /api/addresses)가
 * 동일한 필드명을 사용하도록 강제해서 필드명 불일치 버그를 방지합니다.
 */

/** /api/addresses POST 요청 바디 타입 */
export type SaveAddressRequest = {
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_extra?: string;
  postal_code: string;
  address_main: string;
  address_detail: string;
  memo?: string;
};

/** 저장된 배송지 목록 아이템 타입 (마이페이지·결제창 공용) */
export type SavedAddressItem = {
  id: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_phone_extra: string | null;
  zip_code: string | null;      // DB 컬럼명은 postal_code지만, 결제창 내부 변수명과 맞춤
  address: string;              // DB 컬럼명은 address_main
  detail_address: string | null; // DB 컬럼명은 address_detail
  is_default: boolean;
};
