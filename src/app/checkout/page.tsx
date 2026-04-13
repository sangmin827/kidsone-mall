import {
  getActiveBankAccounts,
  getCheckoutItems,
  getMyAddresses,
} from '@/src/server/checkout';
import CheckoutClient from '@/src/components/checkout/CheckoutClient';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    productId?: string;
    quantity?: string;
  }>;
}) {
  const { mode, productId, quantity } = await searchParams;

  const items = await getCheckoutItems({
    mode,
    productId: productId ? Number(productId) : undefined,
    quantity: quantity ? Number(quantity) : undefined,
  });

  const addresses = await getMyAddresses();
  const bankAccounts = await getActiveBankAccounts();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold">주문 / 결제</h1>

      <CheckoutClient
        initialItems={items}
        addresses={addresses}
        bankAccounts={bankAccounts}
      />
    </main>
  );
}
