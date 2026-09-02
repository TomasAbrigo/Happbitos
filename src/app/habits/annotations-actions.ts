"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { annotations, habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

export type AnnotationFormState = { error: string | null };

export async function setAnnotation(
  habitId: string,
  date: string,
  _prevState: AnnotationFormState,
  formData: FormData,
): Promise<AnnotationFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "La nota no puede estar vacía." };

  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, habitId), eq(habits.userId, user.id)),
  });
  if (!habit) return { error: "Hábito no encontrado." };

  await db
    .insert(annotations)
    .values({ habitId, date, text })
    .onConflictDoUpdate({
      target: [annotations.habitId, annotations.date],
      set: { text },
    });

  revalidatePath(`/habits/${habitId}`);
  return { error: null };
}
