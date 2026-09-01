import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySessionToken } from "@/lib/auth/session";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default async function proxy(request: NextRequest) {
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
