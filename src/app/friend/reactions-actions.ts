"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habits, reactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { areFriends } from "@/lib/friends/get-friends";
import { isValidSticker } from "@/lib/reactions/catalog";
import { sendPushToUser } from "@/lib/push/send-push";

export type ReactionFormState = { error: string | null };

export async function reactToHabit(
  habitId: string,
  weekStart: string,
  _prevState: ReactionFormState,
  formData: FormData,
): Promise<ReactionFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const sticker = String(formData.get("sticker") ?? "");
  if (!isValidSticker(sticker)) return { error: "Sticker inválido." };

  const habit = await db.query.habits.findFirst({
    where: eq(habits.id, habitId),
  });
  if (!habit || !(await areFriends(user.id, habit.userId))) {
    return { error: "Solo podés reaccionar al progreso de tus amigos." };
  }

  await db
    .insert(reactions)
    .values({ fromUserId: user.id, habitId, weekStart, sticker })
    .onConflictDoUpdate({
      target: [reactions.fromUserId, reactions.habitId, reactions.weekStart],
      set: { sticker },
    });

  notifyHabitOwnerOfReaction(user, habit, sticker).catch(() => {});

  revalidatePath("/friend");
  revalidatePath(`/habits/${habitId}`);
  return { error: null };
}

async function notifyHabitOwnerOfReaction(
  fromUser: { id: string; username: string },
  habit: { userId: string; name: string },
  sticker: string,
) {
  if (habit.userId === fromUser.id) return;

  await sendPushToUser(habit.userId, {
    title: "Happbitos",
    body: `${fromUser.username} te puso "${sticker}" en "${habit.name}" 🎉`,
    url: "/friend",
  });
}
