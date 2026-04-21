import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

const STATUS_LABELS: Record<string, string> = {
  pending: "입금 대기",
  paid: "결제 완료",
  preparing: "상품 준비중",
  shipping: "배송 중",
  delivered: "배송 완료",
  cancelled: "주문 취소",
};

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("orders")
    .select(
      `id, order_number, status, total_amount, depositor_name,
       orderer_name, orderer_phone, recipient_name, recipient_phone,
       zip_code, address, detail_address, request_message,
       is_guest, created_at, admin_memo,
       order_items (product_name_snapshot, price_snapshot, quantity)`,
    )
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,orderer_name.ilike.%${search}%,recipient_name.ilike.%${search}%`,
    );
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (dateFrom) {
    query = query.gte("created_at", `${dateFrom}T00:00:00`);
  }
  if (dateTo) {
    query = query.lte("created_at", `${dateTo}T23:59:59`);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  const headers = [
    "주문번호",
    "주문일시",
    "상태",
    "주문 유형",
    "주문자명",
    "주문자 연락처",
    "수령인",
    "수령인 연락처",
    "우편번호",
    "주소",
    "상세주소",
    "주문 상품",
    "총 금액(원)",
    "입금자명",
    "배송 요청사항",
    "관리자 메모(비고)",
  ];

  const rows: string[] = [headers.map(csvCell).join(",")];

  for (const order of orders ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order.order_items as any[])
      .map(
        (item: { product_name_snapshot: string; quantity: number }) =>
          `${item.product_name_snapshot} ${item.quantity}개`,
      )
      .join(" / ");

    rows.push(
      [
        order.order_number ?? "",
        new Date(order.created_at).toLocaleString("ko-KR"),
        STATUS_LABELS[order.status] ?? order.status,
        order.is_guest ? "비회원" : "회원",
        order.orderer_name ?? "",
        order.orderer_phone ?? "",
        order.recipient_name ?? "",
        order.recipient_phone ?? "",
        order.zip_code ?? "",
        order.address ?? "",
        order.detail_address ?? "",
        items,
        String(order.total_amount ?? 0),
        order.depositor_name ?? "",
        order.request_message ?? "",
        order.admin_memo ?? "",
      ]
        .map((v) => csvCell(String(v)))
        .join(","),
    );
  }

  // UTF-8 BOM prefix for Excel Korean character support
  const csv = "\uFEFF" + rows.join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''orders_${today}.csv`,
    },
  });
}
