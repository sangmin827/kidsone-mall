import OrderList from "@/src/components/mypage/OrderList";
import { getMyOrders } from "@/src/server/orders";

export default async function MyPageOrdersPage() {
  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">주문내역</h1>
      <OrderList orders={orders} />
    </div>
  );
}
