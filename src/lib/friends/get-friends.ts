import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { friendships, users } from "@/db/schema";
import { classifyFriendship, type RelationshipStatus } from "./friendship-status";

export type Friend = { id: string; username: string };

function otherSide(
  row: { requesterId: string; addresseeId: string },
  userId: string,
): string {
  return row.requesterId === userId ? row.addresseeId : row.requesterId;
}

export async function getFriends(userId: string): Promise<Friend[]> {
  const rows = await db.query.friendships.findMany({
    where: and(
      eq(friendships.status, "accepted"),
      or(
        eq(friendships.requesterId, userId),
        eq(friendships.addresseeId, userId),
      ),
    ),
  });
  if (rows.length === 0) return [];

  const otherIds = rows.map((row) => otherSide(row, userId));
  const friendUsers = await db.query.users.findMany({
    where: inArray(users.id, otherIds),
    columns: { id: true, username: true },
  });
  const byId = new Map(friendUsers.map((u) => [u.id, u]));
  return otherIds
    .map((id) => byId.get(id))
    .filter((u): u is Friend => Boolean(u));
}

export async function areFriends(
  userAId: string,
  userBId: string,
): Promise<boolean> {
  const row = await db.query.friendships.findFirst({
    where: and(
      eq(friendships.status, "accepted"),
      or(
        and(
          eq(friendships.requesterId, userAId),
          eq(friendships.addresseeId, userBId),
        ),
        and(
          eq(friendships.requesterId, userBId),
          eq(friendships.addresseeId, userAId),
        ),
      ),
    ),
  });
  return Boolean(row);
}

export async function getRelationshipStatuses(
  userId: string,
): Promise<Map<string, { status: RelationshipStatus; friendshipId: string }>> {
  const rows = await db.query.friendships.findMany({
    where: or(
      eq(friendships.requesterId, userId),
      eq(friendships.addresseeId, userId),
    ),
  });

  const result = new Map<string, { status: RelationshipStatus; friendshipId: string }>();
  for (const row of rows) {
    result.set(otherSide(row, userId), {
      status: classifyFriendship(row, userId),
      friendshipId: row.id,
    });
  }
  return result;
}
