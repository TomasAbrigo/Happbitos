export type TrendEntry = { date: string; completed: boolean };

const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export type WeekdayTrend = {
  weekday: number;
  label: string;
  rate: number;
  sampleSize: number;
};

export function computeBestWeekday(
  entries: TrendEntry[],
  minSample = 3,
): WeekdayTrend | null {
  const buckets = new Map<number, { completed: number; total: number }>();

  for (const entry of entries) {
    const day = new Date(`${entry.date}T00:00:00.000Z`).getUTCDay();
    const bucket = buckets.get(day) ?? { completed: 0, total: 0 };
    bucket.total++;
    if (entry.completed) bucket.completed++;
    buckets.set(day, bucket);
  }

  let best: WeekdayTrend | null = null;
  for (const [day, bucket] of buckets) {
    if (bucket.total < minSample) continue;
    const rate = bucket.completed / bucket.total;
    if (!best || rate > best.rate) {
      best = { weekday: day, label: WEEKDAY_LABELS[day], rate, sampleSize: bucket.total };
    }
  }
  return best;
}

export type MonthComparison = {
  thisMonthRate: number;
  lastMonthRate: number;
  thisMonthSample: number;
  lastMonthSample: number;
  delta: number;
};

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function previousMonthKey(monthKeyStr: string): string {
  const [year, month] = monthKeyStr.split("-").map(Number);
  const prev = new Date(Date.UTC(year, month - 2, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function computeMonthComparison(
  entries: TrendEntry[],
  today: string,
): MonthComparison {
  const thisMonth = monthKey(today);
  const lastMonth = previousMonthKey(thisMonth);

  function rateFor(key: string): { rate: number; sample: number } {
    const filtered = entries.filter((e) => monthKey(e.date) === key);
    if (filtered.length === 0) return { rate: 0, sample: 0 };
    const completed = filtered.filter((e) => e.completed).length;
    return { rate: completed / filtered.length, sample: filtered.length };
  }

  const thisMonthStats = rateFor(thisMonth);
  const lastMonthStats = rateFor(lastMonth);

  return {
    thisMonthRate: thisMonthStats.rate,
    lastMonthRate: lastMonthStats.rate,
    thisMonthSample: thisMonthStats.sample,
    lastMonthSample: lastMonthStats.sample,
    delta: thisMonthStats.rate - lastMonthStats.rate,
  };
}
