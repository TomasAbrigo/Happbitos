import { calculateStreak, type FrequencyPeriod } from "./streak";

export type HabitSummaryInput = {
  habitId: string;
  name: string;
  frequencyHistory: FrequencyPeriod[];
  completedDates: string[];
  archivedAt?: string | null;
};

export type HabitWeekSummary = {
  habitId: string;
  name: string;
  completionRate: number;
  currentStreak: number;
  maxStreak: number;
};

export type WeeklySummaryInput = {
  habits: HabitSummaryInput[];
  weekStart: string;
  today: string;
};

function targetForWeek(
  weekStart: string,
  frequencyHistory: FrequencyPeriod[],
): number {
  const sorted = [...frequencyHistory].sort((a, b) =>
    a.effectiveFrom < b.effectiveFrom ? -1 : 1,
  );
  let applicable = sorted[0];
  for (const period of sorted) {
    if (period.effectiveFrom <= weekStart) applicable = period;
  }
  return applicable.timesPerWeek;
}

export function generateWeeklySummary(
  input: WeeklySummaryInput,
): HabitWeekSummary[] {
  const { habits, weekStart, today } = input;

  return habits.map((habit) => {
    const target = targetForWeek(weekStart, habit.frequencyHistory);
    const completedInWeek = habit.completedDates.filter((date) => {
      const weekEnd = new Date(`${weekStart}T00:00:00.000Z`);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      return date >= weekStart && date <= weekEnd.toISOString().slice(0, 10);
    }).length;

    const completionRate = Math.min(1, completedInWeek / target);

    const { currentStreak, maxStreak } = calculateStreak({
      frequencyHistory: habit.frequencyHistory,
      completedDates: habit.completedDates,
      today,
      archivedAt: habit.archivedAt,
    });

    return {
      habitId: habit.habitId,
      name: habit.name,
      completionRate,
      currentStreak,
      maxStreak,
    };
  });
}
