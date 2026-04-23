'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Props = {
  action: (formData: FormData) => Promise<void | { id: number }>;
  successMessage?: string;
  redirectOnSuccess?: string;
  className?: string;
  children: React.ReactNode;
};

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
      // Next.js redirect() throws a special NEXT_REDIRECT error — re-throw it so the router handles it
      const digest = error != null && typeof error === 'object' && 'digest' in error
        ? String((error as Record<string, unknown>).digest)
        : '';
      if (digest.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
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
