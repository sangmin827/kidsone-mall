import { NextResponse } from "next/server";
import { createMyAddress } from "@/src/server/addresses";
import type { SaveAddressRequest } from "@/src/types/address";

export async function POST(request: Request) {
  try {
    // SaveAddressRequest 타입으로 명시 → 필드명이 클라이언트와 서버 사이에서 항상 일치함을 보장
    const body: SaveAddressRequest = await request.json();

    const formData = new FormData();
    formData.append("recipient_name", body.recipient_name ?? "");
    formData.append("recipient_phone", body.recipient_phone ?? "");
    formData.append("recipient_phone_extra", body.recipient_phone_extra ?? "");
    formData.append("postal_code", body.postal_code ?? "");
    formData.append("address_main", body.address_main ?? "");
    formData.append("address_detail", body.address_detail ?? "");
    formData.append("memo", body.memo ?? "");

    await createMyAddress(formData);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "주소 저장 중 오류가 발생했습니다.",
      },
      { status: 400 },
    );
  }
}
