import { NextResponse } from "next/server";
import { createOrder } from "@/src/server/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const order = await createOrder({
      recipient_name: body.recipient_name,
      recipient_phone: body.recipient_phone,
      recipient_phone_extra: body.recipient_phone_extra,
      zip_code: body.zip_code,
      address: body.address,
      detail_address: body.detail_address,
      request_message: body.request_message,
      depositor_name: body.depositor_name,
      orderer_name: body.orderer_name,
      orderer_phone: body.orderer_phone,
      orderer_email: body.orderer_email,
      items: body.items,
      clear_cart: body.clear_cart,
    });

    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "주문 처리 중 오류가 발생했습니다.",
      },
      { status: 400 },
    );
  }
}
