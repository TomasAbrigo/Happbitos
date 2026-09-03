"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { challengeCheckins, challenges } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { areFriends } from "@/lib/friends/get-friends";
import { addDaysIso, todayIso } from "@/lib/date";

export type ChallengeFormState = { error: string | null };

const MIN_DURATION = 3;
const MAX_DURATION = 365;

export async function createChallenge(
  _prevState: ChallengeFormState,
  formData: FormData,
): Promise<ChallengeFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Ponele un nombre al desafío." };

  const durationRaw = Number(formData.get("duration") ?? 30);
  const duration =
    Number.isFinite(durationRaw) &&
    durationRaw >= MIN_DURATION &&
    durationRaw <= MAX_DURATION
      ? durationRaw
      : 30;

  const friendId = String(formData.get("friendId") ?? "");
  if (!friendId || !(await areFriends(user.id, friendId))) {
    return { error: "Elegí con quién armar el desafío." };
  }

  const startDate = todayIso();
  const endDate = addDaysIso(startDate, duration - 1);

  await db.insert(challenges).values({
    createdByUserId: user.id,
    invitedUserId: friendId,
    title,
    startDate,
    endDate,
    status: "pending",
  });

  revalidatePath("/challenges");
  return { error: null };
}

export async function respondToChallenge(challengeId: string, accept: boolean) {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .update(challenges)
    .set({ status: accept ? "accepted" : "declined" })
    .where(
      and(
        eq(challenges.id, challengeId),
        eq(challenges.invitedUserId, user.id),
        eq(challenges.status, "pending"),
      ),
    );

  revalidatePath("/challenges");
}

export async function checkInChallenge(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const challenge = await db.query.challenges.findFirst({
    where: and(
      eq(challenges.id, challengeId),
      or(
        eq(challenges.createdByUserId, user.id),
        eq(challenges.invitedUserId, user.id),
      ),
    ),
  });
  if (!challenge || challenge.status !== "accepted") return;

  const today = todayIso();
  if (today < challenge.startDate || today > challenge.endDate) return;

  await db
    .insert(challengeCheckins)
    .values({ challengeId, userId: user.id, date: today })
    .onConflictDoNothing();

  revalidatePath("/challenges");
}
