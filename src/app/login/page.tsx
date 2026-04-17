import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

/**
 * 로그인 UI 는 전역 <LoginModal /> 로 이관됨.
 * 이 라우트로 들어오면 홈으로 보내면서 모달을 띄운다.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  const params = new URLSearchParams();
  params.set("login", "1");
  if (next) {
    params.set("next", next);
  }

  redirect(`/?${params.toString()}`);
}
