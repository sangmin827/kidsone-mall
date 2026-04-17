import { createClient } from "@/src/lib/supabase/server";
import { requireAdmin } from "@/src/server/admin-auth";

type WriteAdminLogInput = {
  adminUserId: string;
  targetUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  description?: string | null;
};

export async function writeAdminActivityLog(input: WriteAdminLogInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("admin_activity_logs").insert({
    admin_user_id: input.adminUserId,
    target_user_id: input.targetUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    before_data: input.beforeData ?? null,
    after_data: input.afterData ?? null,
    description: input.description ?? null,
  });

  if (error) {
    throw new Error(`관리자 활동 로그 저장 실패: ${error.message}`);
  }
}

export type AdminActivityLog = {
  id: number;
  admin_user_id: string;
  target_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  description: string | null;
  created_at: string;
  admin_email?: string | null;
  admin_name?: string | null;
};

type GetAdminActivityLogsParams = {
  limit?: number;
  offset?: number;
  entityType?: string;
  action?: string;
};

export async function getAdminActivityLogs(
  params: GetAdminActivityLogsParams = {},
): Promise<{ logs: AdminActivityLog[]; total: number }> {
  const { supabase } = await requireAdmin();

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = supabase
    .from("admin_activity_logs")
    .select(
      `
      id,
      admin_user_id,
      target_user_id,
      action,
      entity_type,
      entity_id,
      before_data,
      after_data,
      description,
      created_at
      `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.entityType) {
    query = query.eq("entity_type", params.entityType);
  }
  if (params.action) {
    query = query.eq("action", params.action);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`활동 로그 조회 실패: ${error.message}`);
  }

  const logs = (data ?? []) as AdminActivityLog[];

  // 관리자 이메일/이름을 profiles 에서 조회해서 붙임 (옵션)
  const adminIds = Array.from(new Set(logs.map((log) => log.admin_user_id)));
  if (adminIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", adminIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p] as const),
    );

    for (const log of logs) {
      const profile = profileMap.get(log.admin_user_id);
      if (profile) {
        log.admin_email = profile.email ?? null;
        log.admin_name = profile.name ?? null;
      }
    }
  }

  return { logs, total: count ?? 0 };
}
