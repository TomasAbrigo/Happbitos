import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries } from "@/db/schema";
import { addDaysIso, toIsoDateInTz } from "@/lib/date";
import { getFrozenWeeksByHabit } from "./get-freezes";
import { calculateStreak } from "./streak";

type HabitLike = {
  id: string;
  name: string;
  createdAt: Date;
  frequencyKind: "daily" | "n_per_week";
  timesPerWeek: number | null;
  archivedAt: Date | null;
};

export type StreakRisk = { habitName: string; streak: number };

export async function getStreaksAtRisk(
  missingHabits: HabitLike[],
  today: string,
): Promise<StreakRisk[]> {
  if (missingHabits.length === 0) return [];

  const habitIds = missingHabits.map((h) => h.id);
  const completedEntries = await db.query.habitEntries.findMany({
    where: and(
      inArray(habitEntries.habitId, habitIds),
      eq(habitEntries.completed, true),
    ),
    columns: { habitId: true, date: true },
  });

  const completedByHabit = new Map<string, string[]>();
  for (const entry of completedEntries) {
    const list = completedByHabit.get(entry.habitId) ?? [];
    list.push(entry.date);
    completedByHabit.set(entry.habitId, list);
  }

  const frozenWeeksByHabit = await getFrozenWeeksByHabit(habitIds);
  const yesterday = addDaysIso(today, -1);

  const risks: StreakRisk[] = [];
  for (const habit of missingHabits) {
    const timesPerWeek =
      habit.frequencyKind === "daily" ? 7 : (habit.timesPerWeek ?? 1);
    const { currentStreak } = calculateStreak({
      frequencyHistory: [
        { effectiveFrom: toIsoDateInTz(habit.createdAt), timesPerWeek },
      ],
      completedDates: completedByHabit.get(habit.id) ?? [],
      today: yesterday,
      archivedAt: habit.archivedAt ? toIsoDateInTz(habit.archivedAt) : null,
      frozenWeeks: frozenWeeksByHabit.get(habit.id) ?? [],
    });
    if (currentStreak >= 2) {
      risks.push({ habitName: habit.name, streak: currentStreak });
    }
  }

  return risks.sort((a, b) => b.streak - a.streak);
}
