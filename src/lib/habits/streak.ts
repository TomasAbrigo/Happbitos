export type FrequencyPeriod = {
  effectiveFrom: string;
  timesPerWeek: number;
};

export type StreakInput = {
  frequencyHistory: FrequencyPeriod[];
  completedDates: string[];
  today: string;
  archivedAt?: string | null;
  frozenWeeks?: string[];
};

export type StreakResult = {
  currentStreak: number;
  maxStreak: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

function getWeekStart(iso: string): string {
  const date = parseIsoDate(iso);
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return toIsoDate(date);
}

function targetForWeek(
  weekStart: string,
  frequencyHistory: FrequencyPeriod[],
): number {
  const sorted = [...frequencyHistory].sort((a, b) =>
    a.effectiveFrom < b.effectiveFrom ? -1 : 1,
  );

  let applicable = sorted[0];
  for (const period of sorted) {
    if (period.effectiveFrom <= weekStart) {
      applicable = period;
    }
  }

  return applicable.timesPerWeek;
}

export function calculateStreak(input: StreakInput): StreakResult {
  const { frequencyHistory, completedDates, today, archivedAt, frozenWeeks = [] } = input;
  const frozen = new Set(frozenWeeks);

  if (frequencyHistory.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const cutoff = archivedAt ?? today;
  const habitStart = [...frequencyHistory].sort((a, b) =>
    a.effectiveFrom < b.effectiveFrom ? -1 : 1,
  )[0].effectiveFrom;

  const firstWeekStart = getWeekStart(habitStart);
  const cutoffWeekStart = getWeekStart(cutoff);
  const cutoffWeekEnd = addDays(cutoffWeekStart, 6);

  const completedByWeek = new Map<string, number>();
  for (const date of completedDates) {
    if (date > cutoff) continue;
    const weekStart = getWeekStart(date);
    completedByWeek.set(weekStart, (completedByWeek.get(weekStart) ?? 0) + 1);
  }

  const sequence: boolean[] = [];
  for (
    let weekStart = firstWeekStart;
    weekStart <= cutoffWeekStart;
    weekStart = addDays(weekStart, 7)
  ) {
    const completedCount = completedByWeek.get(weekStart) ?? 0;
    const target = targetForWeek(weekStart, frequencyHistory);
    const met = completedCount >= target || frozen.has(weekStart);
    const isCurrentPartial = weekStart === cutoffWeekStart && cutoff < cutoffWeekEnd;

    if (isCurrentPartial) {
      if (met) sequence.push(true);
    } else {
      sequence.push(met);
    }
  }

  let maxStreak = 0;
  let running = 0;
  for (const met of sequence) {
    running = met ? running + 1 : 0;
    maxStreak = Math.max(maxStreak, running);
  }

  let currentStreak = 0;
  for (let i = sequence.length - 1; i >= 0; i--) {
    if (!sequence[i]) break;
    currentStreak++;
  }

  return { currentStreak, maxStreak };
}
