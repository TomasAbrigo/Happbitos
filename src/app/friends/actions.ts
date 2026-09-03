"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { friendships } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

export type FriendRequestState = { error: string | null };

export async function sendFriendRequest(
  targetUserId: string,
): Promise<FriendRequestState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };
  if (targetUserId === user.id) {
    return { error: "No te podés agregar a vos mismo." };
  }

  const existing = await db.query.friendships.findFirst({
    where: or(
      and(
        eq(friendships.requesterId, user.id),
        eq(friendships.addresseeId, targetUserId),
      ),
      and(
        eq(friendships.requesterId, targetUserId),
        eq(friendships.addresseeId, user.id),
      ),
    ),
  });

  if (existing) {
    if (existing.status === "accepted") {
      return { error: null };
    }
    if (existing.status === "pending" && existing.requesterId === targetUserId) {
      // The other user already asked us — accept it instead of duplicating.
      await db
        .update(friendships)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(eq(friendships.id, existing.id));
    } else if (existing.status === "pending") {
      // Already sent, nothing to do.
      return { error: null };
    } else {
      // Was declined — reactivate as a fresh request from me.
      await db
        .update(friendships)
        .set({
          requesterId: user.id,
          addresseeId: targetUserId,
          status: "pending",
          respondedAt: null,
        })
        .where(eq(friendships.id, existing.id));
    }
  } else {
    await db.insert(friendships).values({
      requesterId: user.id,
      addresseeId: targetUserId,
      status: "pending",
    });
  }

  revalidatePath("/friends");
  revalidatePath("/");
  return { error: null };
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean,
) {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .update(friendships)
    .set({ status: accept ? "accepted" : "declined", respondedAt: new Date() })
    .where(
      and(
        eq(friendships.id, friendshipId),
        eq(friendships.addresseeId, user.id),
        eq(friendships.status, "pending"),
      ),
    );

  revalidatePath("/friends");
  revalidatePath("/");
}
