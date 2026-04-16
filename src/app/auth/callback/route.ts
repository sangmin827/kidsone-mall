import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

function getErrorMessage(
  error: string | null,
  errorDescription: string | null,
) {
  if (errorDescription) return errorDescription;

  switch (error) {
    case "access_denied":
      return "로그인이 취소되었습니다.";
    case "server_error":
      return "소셜 로그인 처리 중 오류가 발생했습니다.";
    default:
      return "로그인 중 문제가 발생했습니다.";
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const message = getErrorMessage(error, errorDescription);

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("로그인 코드를 받지 못했습니다.")}`,
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/?auth=logged-in`);
}
