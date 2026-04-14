import { NextResponse } from "next/server";
import { createOrderFromCart } from "@/src/server/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const order = await createOrderFromCart({
      recipient_name: body.recipient_name,
      recipient_phone: body.recipient_phone,
      zip_code: body.zip_code,
      address: body.address,
      detail_address: body.detail_address,
      request_message: body.request_message,
      depositor_name: body.depositor_name,
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
