import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, unsealSession } from "./lib/auth/session";

/**
 * Cheap gate in front of /admin. Every Server Action and data read re-checks
 * the session itself, so this is a redirect convenience, not the security
 * boundary.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = unsealSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLoginPage = pathname === "/admin/login";

  if (!session && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (session && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};