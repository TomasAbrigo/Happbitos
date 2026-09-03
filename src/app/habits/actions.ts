"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { habitFreezes, habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFriends } from "@/lib/friends/get-friends";
import {
  type HabitFrequency,
  type HabitInput,
  validateHabitInput,
} from "@/lib/habits/domain";
import {
  currentWeekStartIso,
  getFreezeQuotaRemaining,
} from "@/lib/habits/get-freezes";
import { sendPushToUser } from "@/lib/push/send-push";

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

function parseAppearance(formData: FormData) {
  const icon = String(formData.get("icon") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  return { icon: icon || null, color: color || null };
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
  const appearance = parseAppearance(formData);

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
    icon: appearance.icon,
    color: appearance.color,
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
  const appearance = parseAppearance(formData);

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
      icon: appearance.icon,
      color: appearance.color,
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
    .set({ status: "archived", archivedAt: new Date() })
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));

  revalidatePath("/");
}

export async function unarchiveHabit(habitId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .update(habits)
    .set({ status: "active", archivedAt: null })
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));

  revalidatePath("/");
}

export async function deleteHabit(habitId: string) {
  const user = await getCurrentUser();
  if (!user) return;

  await db
    .delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));

  revalidatePath("/");
}

export type FreezeState = { error: string | null };

export async function applyFreeze(
  habitId: string,
): Promise<FreezeState> {
  const user = await getCurrentUser();
  if (!user) return { error: "No autenticado." };

  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, habitId), eq(habits.userId, user.id)),
  });
  if (!habit) return { error: "Hábito no encontrado." };

  const weekStart = currentWeekStartIso();

  const existingForWeek = await db.query.habitFreezes.findFirst({
    where: and(
      eq(habitFreezes.habitId, habitId),
      eq(habitFreezes.weekStart, weekStart),
    ),
  });
  if (existingForWeek) {
    return { error: "Ya usaste el comodín esta semana en este hábito." };
  }

  const remaining = await getFreezeQuotaRemaining(user.id);
  if (remaining <= 0) {
    return { error: "Ya usaste tus comodines de este mes." };
  }

  await db.insert(habitFreezes).values({ habitId, weekStart });

  notifyPartnerOfFreeze(user, habit.name).catch(() => {});

  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
  return { error: null };
}

async function notifyPartnerOfFreeze(
  user: { id: string; username: string },
  habitName: string,
) {
  const friends = await getFriends(user.id);
  await Promise.all(
    friends.map((friend) =>
      sendPushToUser(friend.id, {
        title: "Happbitos",
        body: `${user.username} usó un comodín en "${habitName}" esta semana ❄️`,
        url: `/friend?id=${user.id}`,
      }),
    ),
  );
}
