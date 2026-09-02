import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { buildAuthorizeUrl } from "@/lib/whoop/client";

const STATE_COOKIE_NAME = "whoop_oauth_state";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = randomBytes(16).toString("hex");

  (await cookies()).set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = new URL("/api/whoop/callback", request.url).toString();
  return NextResponse.redirect(buildAuthorizeUrl(state, redirectUri));
}
