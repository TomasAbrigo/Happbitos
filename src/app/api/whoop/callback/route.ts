import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { whoopConnections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { exchangeCodeForTokens } from "@/lib/whoop/client";

const STATE_COOKIE_NAME = "whoop_oauth_state";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
  cookieStore.delete(STATE_COOKIE_NAME);

  const home = new URL("/", request.url);

  if (error || !code || !state || state !== expectedState) {
    home.searchParams.set("whoop", "error");
    return NextResponse.redirect(home);
  }

  try {
    const redirectUri = new URL("/api/whoop/callback", request.url).toString();
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    await db
      .insert(whoopConnections)
      .values({
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      })
      .onConflictDoUpdate({
        target: whoopConnections.userId,
        set: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      });
    home.searchParams.set("whoop", "connected");
  } catch {
    home.searchParams.set("whoop", "error");
  }

  return NextResponse.redirect(home);
}
