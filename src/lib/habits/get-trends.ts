import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import {
  computeBestWeekday,
  computeMonthComparison,
  type MonthComparison,
  type WeekdayTrend,
} from "./trends";

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getTrendsForUser(userId: string): Promise<{
  bestWeekday: WeekdayTrend | null;
  monthComparison: MonthComparison;
}> {
  const userHabits = await db.query.habits.findMany({
    where: eq(habits.userId, userId),
  });

  const today = toIsoDate(new Date());
  if (userHabits.length === 0) {
    return {
      bestWeekday: null,
      monthComparison: computeMonthComparison([], today),
    };
  }

  const habitIds = userHabits.map((h) => h.id);
  const entries = await db.query.habitEntries.findMany({
    where: inArray(habitEntries.habitId, habitIds),
    columns: { date: true, completed: true },
  });

  return {
    bestWeekday: computeBestWeekday(entries),
    monthComparison: computeMonthComparison(entries, today),
  };
}
