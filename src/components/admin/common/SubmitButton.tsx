'use client';

import { useFormStatus } from 'react-dom';

type Props = {
  label: string;
  pendingLabel?: string;
  className?: string;
};

/**
 * AdminFormShell 내부에서 쓰는 제출 버튼.
 * 폼 제출 중에는 자동으로 비활성화 + '저장 중...' 라벨 노출.
 */
export default function SubmitButton({
  label,
  pendingLabel = '저장 중...',
  className,
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className ?? ''} disabled:cursor-not-allowed disabled:opacity-60`.trim()}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
