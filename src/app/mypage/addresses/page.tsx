// src/app/mypage/addresses/page.tsx
import AddressForm from "@/src/components/mypage/AddressForm";
import AddressList from "@/src/components/mypage/AddressList";
import { getMyAddresses } from "@/src/server/addresses";

export default async function MyAddressesPage() {
  const addresses = await getMyAddresses();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">배송지 관리</h1>
      <AddressForm />
      <AddressList addresses={addresses} />
    </div>
  );
}
