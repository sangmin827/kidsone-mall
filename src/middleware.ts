import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin 영역 Basic Auth 게이트.
 *
 * 환경변수:
 *   ADMIN_BASIC_AUTH_USER  (미설정 시 게이트 비활성 — 로컬 개발용)
 *   ADMIN_BASIC_AUTH_PASS
 *
 * 동작:
 *   1. /admin/* 경로에 대해 요청 헤더의 Authorization: Basic ... 검증
 *   2. 일치하지 않으면 401 + WWW-Authenticate 응답 → 브라우저가 로그인 프롬프트 표시
 *   3. 일치하면 다음 단계로 통과 — 페이지 내부의 requireAdmin() 이 Supabase role 재검증
 *
 * 주의:
 *   - Basic Auth 는 HTTPS 하에서만 사용할 것 (Vercel 에서는 기본 HTTPS)
 *   - 자격증명이 노출되지 않도록 Vercel Environment Variable 로만 설정
 */

const ADMIN_PATH_PREFIX = "/admin";

function verifyBasicAuth(
  request: NextRequest,
  expectedUser: string,
  expectedPass: string,
): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return false;
  }

  try {
    const encoded = authHeader.slice("Basic ".length).trim();
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) return false;

    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);

    return user === expectedUser && pass === expectedPass;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname !== ADMIN_PATH_PREFIX &&
    !pathname.startsWith(`${ADMIN_PATH_PREFIX}/`)
  ) {
    return NextResponse.next();
  }

  const user = process.env.ADMIN_BASIC_AUTH_USER;
  const pass = process.env.ADMIN_BASIC_AUTH_PASS;

  // 자격증명 환경변수가 설정되지 않은 경우 게이트 비활성 (개발 편의)
  // 프로덕션에서는 반드시 설정할 것.
  if (!user || !pass) {
    return NextResponse.next();
  }

  if (verifyBasicAuth(request, user, pass)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="KidsOne Admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
