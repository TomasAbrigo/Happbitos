import { eq } from "drizzle-orm";
import { db } from "@/db";
import { whoopConnections } from "@/db/schema";
import {
  fetchLatestRecovery,
  fetchLatestSleep,
  refreshTokens,
  type WhoopRecovery,
  type WhoopSleep,
} from "./client";

export type WhoopStatus =
  | { connected: false }
  | {
      connected: true;
      recovery: WhoopRecovery | null;
      sleep: WhoopSleep | null;
    };

const REFRESH_MARGIN_MS = 60_000;

async function getValidAccessToken(
  connection: typeof whoopConnections.$inferSelect,
): Promise<string | null> {
  const needsRefresh =
    connection.expiresAt.getTime() - Date.now() < REFRESH_MARGIN_MS;
  if (!needsRefresh) return connection.accessToken;

  try {
    const tokens = await refreshTokens(connection.refreshToken);
    await db
      .update(whoopConnections)
      .set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      })
      .where(eq(whoopConnections.userId, connection.userId));
    return tokens.accessToken;
  } catch {
    return null;
  }
}

export async function getWhoopStatus(userId: string): Promise<WhoopStatus> {
  const connection = await db.query.whoopConnections.findFirst({
    where: eq(whoopConnections.userId, userId),
  });
  if (!connection) return { connected: false };

  const accessToken = await getValidAccessToken(connection);
  if (!accessToken) {
    // Refresh token itself was rejected (revoked from WHOOP's side) — drop
    // the stale connection so the UI offers to reconnect.
    await db
      .delete(whoopConnections)
      .where(eq(whoopConnections.userId, userId));
    return { connected: false };
  }

  const [recovery, sleep] = await Promise.all([
    fetchLatestRecovery(accessToken).catch(() => null),
    fetchLatestSleep(accessToken).catch(() => null),
  ]);

  return { connected: true, recovery, sleep };
}
