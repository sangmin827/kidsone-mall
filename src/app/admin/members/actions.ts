"use server";

import { revalidatePath } from "next/cache";
import { updateAdminMemberMeta } from "@/src/server/members";
import type { MemberGrade, MemberStatus } from "@/src/types/member";

function isValidStatus(value: string): value is MemberStatus {
  return ["active", "inactive", "blocked", "withdrawn"].includes(value);
}

function isValidGrade(value: string): value is MemberGrade {
  return ["normal", "vip", "black"].includes(value);
}

export async function updateAdminMemberMetaAction(
  formData: FormData,
): Promise<void> {
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  const grade = String(formData.get("grade") ?? "");
  const memo = String(formData.get("memo") ?? "");

  if (!userId) {
    throw new Error("회원 ID가 없습니다.");
  }

  if (!isValidStatus(status)) {
    throw new Error("유효하지 않은 상태값입니다.");
  }

  if (!isValidGrade(grade)) {
    throw new Error("유효하지 않은 등급값입니다.");
  }

  await updateAdminMemberMeta({
    userId,
    status,
    grade,
    memo: memo || null,
  });

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
}
