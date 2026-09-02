"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habits, reactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOtherUser } from "@/lib/auth/other-user";
import { isValidSticker } from "@/lib/reactions/catalog";

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

  const friend = await getOtherUser(user.id);
  if (!friend) return { error: "No hay otro usuario en la app." };

  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, habitId), eq(habits.userId, friend.id)),
  });
  if (!habit) {
    return { error: "Solo podés reaccionar al progreso del otro usuario." };
  }

  await db
    .insert(reactions)
    .values({ fromUserId: user.id, habitId, weekStart, sticker })
    .onConflictDoUpdate({
      target: [reactions.fromUserId, reactions.habitId, reactions.weekStart],
      set: { sticker },
    });

  revalidatePath("/friend");
  revalidatePath(`/habits/${habitId}`);
  return { error: null };
}
