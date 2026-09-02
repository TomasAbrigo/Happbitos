import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

const PUBLIC_ASSET_PATTERN =
  /^\/(manifest\.webmanifest|sw\.js|icon\.png|apple-icon\.png|icon-\d+\.png|icon-maskable-\d+\.png)$/;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default async function proxy(request: NextRequest) {
  if (PUBLIC_ASSET_PATTERN.test(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token
    ? await verifySessionToken(token, process.env.AUTH_SECRET!)
    : null;

  const isLoginRoute = request.nextUrl.pathname === "/login";

  if (!session && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isLoginRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}
