import { getAdminCancelRequests, getAdminReturnRequests } from "@/src/server/admin-cancel-return";
import CancelReturnManager from "@/src/components/admin/cancel-returns/CancelReturnManager";

type SearchParams = { tab?: string };

export default async function AdminCancelReturnsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [cancelRequests, returnRequests] = await Promise.all([
    getAdminCancelRequests(),
    getAdminReturnRequests(),
  ]);

  const validTabs = ["all", "cancel_req", "cancel_withdraw", "return_req", "return_withdraw"] as const;
  type Tab = (typeof validTabs)[number];
  const initialTab: Tab = validTabs.includes(params.tab as Tab)
    ? (params.tab as Tab)
    : "all";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">취소 / 반품 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          고객의 취소 · 반품 요청과 철회 요청을 확인하고 처리하세요.
        </p>
      </div>

      <CancelReturnManager
        cancelRequests={cancelRequests}
        returnRequests={returnRequests}
        initialTab={initialTab}
      />
    </div>
  );
}
