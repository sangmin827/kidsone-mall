import { requireAdmin } from "@/src/server/admin-auth";
import { writeAdminActivityLog } from "@/src/server/admin-activity-logs";
import type {
  AdminMemberDetail,
  AdminMemberListItem,
  AdminMemberListParams,
  MemberGrade,
  MemberStatus,
} from "@/src/types/member";

type AdminMemberMetaUpdateInput = {
  userId: string;
  status: MemberStatus;
  grade: MemberGrade;
  memo: string | null;
};

function normalizeSearch(value?: string) {
  return value?.trim() ?? "";
}

function buildProfileSort(sort?: AdminMemberListParams["sort"]) {
  switch (sort) {
    case "created_at_asc":
      return { column: "created_at", ascending: true };
    case "name_asc":
      return { column: "name", ascending: true };
    case "email_asc":
      return { column: "email", ascending: true };
    case "created_at_desc":
    default:
      return { column: "created_at", ascending: false };
  }
}

export async function getAdminMembers(
  params: AdminMemberListParams = {},
): Promise<AdminMemberListItem[]> {
  const { supabase } = await requireAdmin();

  const search = normalizeSearch(params.search);
  const sort = buildProfileSort(params.sort);

  let query = supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      name,
      phone,
      role,
      provider,
      created_at,
      updated_at,
      last_login_at,
      member_admin_meta (
        status,
        grade,
        memo
      )
    `,
    )
    .order(sort.column, { ascending: sort.ascending });

  if (params.role && params.role !== "all") {
    query = query.eq("role", params.role);
  }

  if (params.provider && params.provider !== "all") {
    query = query.eq("provider", params.provider);
  }

  if (search) {
    query = query.or(
      `email.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const { data: profiles, error } = await query;

  if (error) {
    throw new Error(`회원 목록 조회 실패: ${error.message}`);
  }

  const rows =
    profiles?.map((profile) => {
      const meta = Array.isArray(profile.member_admin_meta)
        ? profile.member_admin_meta[0]
        : profile.member_admin_meta;

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        provider: profile.provider,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_login_at: profile.last_login_at,
        status: meta?.status ?? "active",
        grade: meta?.grade ?? "normal",
        memo: meta?.memo ?? null,
      };
    }) ?? [];

  let filtered = rows;

  if (params.status && params.status !== "all") {
    filtered = filtered.filter((item) => item.status === params.status);
  }

  if (params.grade && params.grade !== "all") {
    filtered = filtered.filter((item) => item.grade === params.grade);
  }

  const userIds = filtered.map((item) => item.id);

  if (userIds.length === 0) {
    return [];
  }

  const [{ data: orders }, { data: addresses }] = await Promise.all([
    supabase
      .from("orders")
      .select("user_id, total_amount")
      .in("user_id", userIds),
    supabase
      .from("shipping_addresses")
      .select("user_id")
      .in("user_id", userIds),
  ]);

  const orderMap = new Map<
    string,
    { order_count: number; total_order_amount: number }
  >();

  for (const order of orders ?? []) {
    const prev = orderMap.get(order.user_id) ?? {
      order_count: 0,
      total_order_amount: 0,
    };

    orderMap.set(order.user_id, {
      order_count: prev.order_count + 1,
      total_order_amount: prev.total_order_amount + (order.total_amount ?? 0),
    });
  }

  const addressMap = new Map<string, number>();

  for (const address of addresses ?? []) {
    addressMap.set(address.user_id, (addressMap.get(address.user_id) ?? 0) + 1);
  }

  return filtered.map((item) => {
    const orderSummary = orderMap.get(item.id) ?? {
      order_count: 0,
      total_order_amount: 0,
    };

    return {
      ...item,
      order_count: orderSummary.order_count,
      total_order_amount: orderSummary.total_order_amount,
      address_count: addressMap.get(item.id) ?? 0,
    };
  });
}

export async function getAdminMemberById(
  userId: string,
): Promise<AdminMemberDetail | null> {
  const { supabase } = await requireAdmin();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      name,
      phone,
      role,
      provider,
      provider_user_id,
      created_at,
      updated_at,
      last_login_at,
      member_admin_meta (
        status,
        grade,
        memo,
        created_at,
        updated_at
      )
    `,
    )
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(`회원 상세 조회 실패: ${profileError.message}`);
  }

  if (!profile) {
    return null;
  }

  const [{ data: orders }, { data: addresses }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total_amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("shipping_addresses")
      .select(
        `
        id,
        recipient_name,
        recipient_phone,
        postal_code,
        address_main,
        address_detail,
        memo,
        is_default,
        created_at
      `,
      )
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const meta = Array.isArray(profile.member_admin_meta)
    ? profile.member_admin_meta[0]
    : profile.member_admin_meta;

  return {
    profile: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      provider: profile.provider,
      provider_user_id: profile.provider_user_id,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_login_at: profile.last_login_at,
    },
    admin_meta: {
      status: meta?.status ?? "active",
      grade: meta?.grade ?? "normal",
      memo: meta?.memo ?? null,
      created_at: meta?.created_at ?? profile.created_at,
      updated_at: meta?.updated_at ?? profile.updated_at,
    },
    order_summary: {
      order_count: orders?.length ?? 0,
      total_order_amount:
        orders?.reduce((sum, order) => sum + (order.total_amount ?? 0), 0) ?? 0,
      last_order_at: orders?.[0]?.created_at ?? null,
    },
    addresses:
      addresses?.map((address) => ({
        id: address.id,
        recipient_name: address.recipient_name,
        recipient_phone: address.recipient_phone,
        postal_code: address.postal_code,
        address_main: address.address_main,
        address_detail: address.address_detail,
        memo: address.memo,
        is_default: address.is_default,
        created_at: address.created_at,
      })) ?? [],
    recent_orders:
      orders?.slice(0, 10).map((order) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at,
      })) ?? [],
  };
}

export async function updateAdminMemberMeta(input: AdminMemberMetaUpdateInput) {
  const { supabase, adminUserId } = await requireAdmin();

  const { data: beforeRow, error: beforeError } = await supabase
    .from("member_admin_meta")
    .select("user_id, status, grade, memo")
    .eq("user_id", input.userId)
    .single();

  if (beforeError && beforeError.code !== "PGRST116") {
    throw new Error(`회원 메타 조회 실패: ${beforeError.message}`);
  }

  const payload = {
    user_id: input.userId,
    status: input.status,
    grade: input.grade,
    memo: input.memo?.trim() ? input.memo.trim() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("member_admin_meta").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    throw new Error(`회원 메타 수정 실패: ${error.message}`);
  }

  await writeAdminActivityLog({
    adminUserId,
    targetUserId: input.userId,
    action: "member_admin_meta_updated",
    entityType: "member_admin_meta",
    entityId: input.userId,
    beforeData: beforeRow ?? null,
    afterData: payload,
    description: "회원 상태/등급/메모 수정",
  });
}
