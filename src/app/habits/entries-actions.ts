"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFriends } from "@/lib/friends/get-friends";
import { isCompleted } from "@/lib/habits/completion";
import { sendPushToUser } from "@/lib/push/send-push";

export type EntryFormState = { error: string | null };

export async function logHabitEntry(
  habitId: string,
  _prevState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const date = String(formData.get("date") ?? "");
  if (!date) return { error: "La fecha es requerida." };

  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, habitId), eq(habits.userId, user.id)),
  });
  if (!habit) return { error: "Hábito no encontrado." };

  const quantityRaw = formData.get("quantity");
  const quantity =
    habit.type === "quantity" && quantityRaw ? Number(quantityRaw) : null;
  const checkedRaw = formData.get("completed");
  const completed =
    habit.type === "binary"
      ? checkedRaw === "on"
      : isCompleted({ type: habit.type, target: habit.target }, { quantity });

  const existingEntry = await db.query.habitEntries.findFirst({
    where: and(eq(habitEntries.habitId, habitId), eq(habitEntries.date, date)),
    columns: { completed: true },
  });

  await db
    .insert(habitEntries)
    .values({ habitId, date, completed, quantity })
    .onConflictDoUpdate({
      target: [habitEntries.habitId, habitEntries.date],
      set: { completed, quantity },
    });

  if (completed && !existingEntry?.completed) {
    notifyPartnerOfCompletion(user, habit.name).catch(() => {});
  }

  revalidatePath("/");
  return { error: null };
}

async function notifyPartnerOfCompletion(
  user: { id: string; username: string },
  habitName: string,
) {
  const friends = await getFriends(user.id);
  await Promise.all(
    friends.map((friend) =>
      sendPushToUser(friend.id, {
        title: "Happbitos",
        body: `${user.username} marcó "${habitName}" ✅`,
        url: `/friend?id=${user.id}`,
      }),
    ),
  );
}
