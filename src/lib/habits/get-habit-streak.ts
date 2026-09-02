import { toIsoDateInTz, todayIso } from "@/lib/date";
import { calculateStreak, type StreakResult } from "./streak";

type HabitLike = {
  createdAt: Date;
  frequencyKind: "daily" | "n_per_week";
  timesPerWeek: number | null;
  archivedAt: Date | null;
};

export function getHabitStreak(
  habit: HabitLike,
  completedDates: string[],
  frozenWeeks: string[] = [],
): StreakResult {
  const timesPerWeek =
    habit.frequencyKind === "daily" ? 7 : (habit.timesPerWeek ?? 1);

  return calculateStreak({
    frequencyHistory: [
      { effectiveFrom: toIsoDateInTz(habit.createdAt), timesPerWeek },
    ],
    completedDates,
    today: todayIso(),
    archivedAt: habit.archivedAt ? toIsoDateInTz(habit.archivedAt) : null,
    frozenWeeks,
  });
}
