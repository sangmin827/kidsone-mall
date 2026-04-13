// src/components/mypage/AddressList.tsx
import type { ShippingAddress } from "@/src/server/addresses";
import { deleteMyAddress } from "@/src/server/addresses";

type Props = {
  addresses: ShippingAddress[];
};

export default function AddressList({ addresses }: Props) {
  if (addresses.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold">저장된 배송지</h2>
        <p className="mt-2 text-sm text-gray-500">등록된 배송지가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">저장된 배송지</h2>

      {addresses.map((address) => (
        <div
          key={address.id}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-semibold">
                {address.recipient_name} / {address.recipient_phone}
              </p>
              <p className="text-sm text-gray-700">
                [{address.postal_code ?? "-"}] {address.address_main}
                {address.address_detail ? ` ${address.address_detail}` : ""}
              </p>
              <p className="text-sm text-gray-700">
                비고사항: {address.memo ?? "없음"}
              </p>
              {address.is_default && (
                <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                  기본 배송지
                </span>
              )}
            </div>

            <form
              action={async () => {
                "use server";
                await deleteMyAddress(address.id);
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-red-300 px-3 py-2 text-sm text-red-600"
              >
                삭제
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
