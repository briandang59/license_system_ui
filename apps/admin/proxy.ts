import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // shortcut: cookie presence only; backend must verify tokens for protected data.
  const hasSession = Boolean(request.cookies.get("access_token")?.value);
  const isLoginPage = request.nextUrl.pathname === "/auth/login";

  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|favicon.ico|robots.txt|sitemap.xml|next.svg|vercel.svg|auth-workspace.svg).*)"],
};
