import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitFreezes, habits } from "@/db/schema";
import { startOfDayInTz, todayIso } from "@/lib/date";

export const MONTHLY_FREEZE_QUOTA = 2;

export async function getFrozenWeeksByHabit(
  habitIds: string[],
): Promise<Map<string, string[]>> {
  if (habitIds.length === 0) return new Map();

  const rows = await db.query.habitFreezes.findMany({
    where: inArray(habitFreezes.habitId, habitIds),
  });

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.habitId) ?? [];
    list.push(row.weekStart);
    map.set(row.habitId, list);
  }
  return map;
}

export { currentWeekStartIso } from "@/lib/date";

function monthStart(): Date {
  const firstOfMonth = `${todayIso().slice(0, 7)}-01`;
  return startOfDayInTz(firstOfMonth);
}

export async function getFreezeQuotaRemaining(userId: string): Promise<number> {
  const userHabits = await db.query.habits.findMany({
    where: eq(habits.userId, userId),
    columns: { id: true },
  });
  const habitIds = userHabits.map((h) => h.id);
  if (habitIds.length === 0) return MONTHLY_FREEZE_QUOTA;

  const usedThisMonth = await db.query.habitFreezes.findMany({
    where: and(
      inArray(habitFreezes.habitId, habitIds),
      gte(habitFreezes.createdAt, monthStart()),
    ),
  });

  return Math.max(0, MONTHLY_FREEZE_QUOTA - usedThisMonth.length);
}
