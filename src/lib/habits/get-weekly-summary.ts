import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import { currentWeekStartIso, toIsoDateInTz, todayIso } from "@/lib/date";
import { getFrozenWeeksByHabit } from "./get-freezes";
import {
  generateWeeklySummary,
  type HabitWeekSummary,
} from "./weekly-summary";

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

  const frozenWeeksByHabit = await getFrozenWeeksByHabit(habitIds);

  return generateWeeklySummary({
    weekStart: currentWeekStartIso(),
    today: todayIso(),
    habits: userHabits.map((habit) => {
      const timesPerWeek =
        habit.frequencyKind === "daily" ? 7 : (habit.timesPerWeek ?? 1);
      return {
        habitId: habit.id,
        name: habit.name,
        frequencyHistory: [
          { effectiveFrom: toIsoDateInTz(habit.createdAt), timesPerWeek },
        ],
        completedDates: completedByHabit.get(habit.id) ?? [],
        archivedAt: habit.archivedAt ? toIsoDateInTz(habit.archivedAt) : null,
        frozenWeeks: frozenWeeksByHabit.get(habit.id) ?? [],
      };
    }),
  });
}
