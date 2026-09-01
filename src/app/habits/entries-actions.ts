"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isCompleted } from "@/lib/habits/completion";

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

  await db
    .insert(habitEntries)
    .values({ habitId, date, completed, quantity })
    .onConflictDoUpdate({
      target: [habitEntries.habitId, habitEntries.date],
      set: { completed, quantity },
    });

  revalidatePath("/");
  return { error: null };
}
