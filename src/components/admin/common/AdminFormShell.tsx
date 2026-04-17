'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Props = {
  action: (formData: FormData) => Promise<void>;
  successMessage?: string;
  redirectOnSuccess?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * 관리자 폼 공통 쉘.
 * - 서버 액션 호출 성공/실패를 toast 로 피드백
 * - 성공 후 특정 경로로 이동하려면 redirectOnSuccess 사용
 *
 * useFormStatus 가 그대로 동작하므로 children 안에서 SubmitButton 이 pending 을 읽을 수 있다.
 */
export default function AdminFormShell({
  action,
  successMessage = '저장되었습니다.',
  redirectOnSuccess,
  className,
  children,
}: Props) {
  const router = useRouter();

  async function wrappedAction(formData: FormData) {
    try {
      await action(formData);
      toast.success(successMessage);
      if (redirectOnSuccess) {
        router.push(redirectOnSuccess);
      } else {
        router.refresh();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '저장에 실패했습니다.';
      toast.error(message);
    }
  }

  return (
    <form action={wrappedAction} className={className}>
      {children}
    </form>
  );
}
