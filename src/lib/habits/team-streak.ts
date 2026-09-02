export type ScopedHabit = {
  id: string;
  createdAt: string;
  archivedAt: string | null;
};

export function computePerfectDays(
  habits: ScopedHabit[],
  completedDatesByHabit: Map<string, Set<string>>,
  dates: string[],
): Set<string> {
  const perfect = new Set<string>();

  for (const date of dates) {
    const scoped = habits.filter(
      (h) => h.createdAt <= date && (!h.archivedAt || h.archivedAt > date),
    );
    if (scoped.length === 0) continue;

    const allDone = scoped.every((h) =>
      completedDatesByHabit.get(h.id)?.has(date),
    );
    if (allDone) perfect.add(date);
  }

  return perfect;
}

export type TeamStreakResult = { currentStreak: number; maxStreak: number };

export function computeTeamStreak(
  perfectDaysA: Set<string>,
  perfectDaysB: Set<string>,
  dates: string[],
  today: string,
): TeamStreakResult {
  const bothPerfect = (date: string) =>
    perfectDaysA.has(date) && perfectDaysB.has(date);

  const sequence = dates.filter((date) => date !== today || bothPerfect(date));

  let maxStreak = 0;
  let running = 0;
  for (const date of sequence) {
    running = bothPerfect(date) ? running + 1 : 0;
    maxStreak = Math.max(maxStreak, running);
  }

  let currentStreak = 0;
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (!bothPerfect(sequence[i])) break;
    currentStreak++;
  }

  return { currentStreak, maxStreak };
}
