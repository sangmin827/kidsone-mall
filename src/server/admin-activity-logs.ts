import { createClient } from "@/src/lib/supabase/server";

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
