import { calculateStreak, type StreakResult } from "./streak";

type HabitLike = {
  createdAt: Date;
  frequencyKind: "daily" | "n_per_week";
  timesPerWeek: number | null;
  archivedAt: Date | null;
};

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getHabitStreak(
  habit: HabitLike,
  completedDates: string[],
): StreakResult {
  const timesPerWeek =
    habit.frequencyKind === "daily" ? 7 : (habit.timesPerWeek ?? 1);

  return calculateStreak({
    frequencyHistory: [
      { effectiveFrom: toIsoDate(habit.createdAt), timesPerWeek },
    ],
    completedDates,
    today: toIsoDate(new Date()),
    archivedAt: habit.archivedAt ? toIsoDate(habit.archivedAt) : null,
  });
}
