import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import {
  generateWeeklySummary,
  type HabitWeekSummary,
} from "./weekly-summary";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function currentWeekStart(): string {
  const date = new Date();
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return toIsoDate(date);
}

export async function getWeeklySummaryForUser(
  userId: string,
): Promise<HabitWeekSummary[]> {
  const userHabits = await db.query.habits.findMany({
    where: eq(habits.userId, userId),
  });
  if (userHabits.length === 0) return [];

  const habitIds = userHabits.map((h) => h.id);
  const completedEntries = await db.query.habitEntries.findMany({
    where: (e, { and, eq: eqOp }) =>
      and(inArray(e.habitId, habitIds), eqOp(e.completed, true)),
  });

  const completedByHabit = new Map<string, string[]>();
  for (const entry of completedEntries) {
    const list = completedByHabit.get(entry.habitId) ?? [];
    list.push(entry.date);
    completedByHabit.set(entry.habitId, list);
  }

  return generateWeeklySummary({
    weekStart: currentWeekStart(),
    today: toIsoDate(new Date()),
    habits: userHabits.map((habit) => {
      const timesPerWeek =
        habit.frequencyKind === "daily" ? 7 : (habit.timesPerWeek ?? 1);
      return {
        habitId: habit.id,
        name: habit.name,
        frequencyHistory: [
          { effectiveFrom: toIsoDate(habit.createdAt), timesPerWeek },
        ],
        completedDates: completedByHabit.get(habit.id) ?? [],
        archivedAt: habit.archivedAt ? toIsoDate(habit.archivedAt) : null,
      };
    }),
  });
}
