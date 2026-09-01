"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  type HabitFrequency,
  type HabitInput,
  validateHabitInput,
} from "@/lib/habits/domain";

export type HabitFormState = { error: string | null };

function parseFrequency(formData: FormData): HabitFrequency {
  const kind = String(formData.get("frequencyKind") ?? "daily");
  if (kind === "n_per_week") {
    return {
      kind: "n_per_week",
      timesPerWeek: Number(formData.get("timesPerWeek") ?? 0),
    };
  }
  return { kind: "daily" };
}

function parseHabitInput(formData: FormData): HabitInput {
  const type = String(formData.get("type") ?? "binary") as
    | "binary"
    | "quantity";
  const targetRaw = formData.get("target");

  return {
    name: String(formData.get("name") ?? ""),
    type,
    target: targetRaw ? Number(targetRaw) : undefined,
    frequency: parseFrequency(formData),
  };
}

export async function createHabit(
  _prevState: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const input = parseHabitInput(formData);
  const result = validateHabitInput(input);
  if (!result.valid) return { error: result.errors.join(" ") };

  await db.insert(habits).values({
    userId: user.id,
    name: input.name.trim(),
    type: input.type,
    target: input.target ?? null,
    frequencyKind: input.frequency.kind,
    timesPerWeek:
      input.frequency.kind === "n_per_week"
        ? input.frequency.timesPerWeek
        : null,
  });

  revalidatePath("/");
  return { error: null };
}

export async function updateHabit(
  habitId: string,
  _prevState: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const input = parseHabitInput(formData);
  const result = validateHabitInput(input);
  if (!result.valid) return { error: result.errors.join(" ") };

  await db
    .update(habits)
    .set({
      name: input.name.trim(),
      type: input.type,
      target: input.target ?? null,
      frequencyKind: input.frequency.kind,
      timesPerWeek:
        input.frequency.kind === "n_per_week"
          ? input.frequency.timesPerWeek
          : null,
    })
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));

  revalidatePath("/");
  return { error: null };
}

export async function archiveHabit(habitId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .update(habits)
    .set({ status: "archived" })
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));

  revalidatePath("/");
}
