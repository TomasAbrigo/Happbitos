import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import { addDaysIso, toIsoDateInTz, todayIso } from "@/lib/date";
import {
  computePerfectDays,
  computeTeamStreak,
  type TeamStreakResult,
} from "./team-streak";

const WINDOW_DAYS = 120;

function recentDates(windowDays: number): string[] {
  const today = todayIso();
  const dates: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    dates.push(addDaysIso(today, -i));
  }
  return dates;
}

async function getPerfectDaysForUser(
  userId: string,
  dates: string[],
): Promise<Set<string>> {
  const userHabits = await db.query.habits.findMany({
    where: eq(habits.userId, userId),
  });
  const habitIds = userHabits.map((h) => h.id);

  const completedEntries = habitIds.length
    ? await db.query.habitEntries.findMany({
        where: and(
          inArray(habitEntries.habitId, habitIds),
          eq(habitEntries.completed, true),
        ),
        columns: { habitId: true, date: true },
      })
    : [];

  const completedByHabit = new Map<string, Set<string>>();
  for (const entry of completedEntries) {
    const set = completedByHabit.get(entry.habitId) ?? new Set();
    set.add(entry.date);
    completedByHabit.set(entry.habitId, set);
  }

  const scoped = userHabits.map((h) => ({
    id: h.id,
    createdAt: toIsoDateInTz(h.createdAt),
    archivedAt: h.archivedAt ? toIsoDateInTz(h.archivedAt) : null,
  }));

  return computePerfectDays(scoped, completedByHabit, dates);
}

export async function getTeamStreak(
  userAId: string,
  userBId: string,
): Promise<TeamStreakResult> {
  const dates = recentDates(WINDOW_DAYS);
  const today = todayIso();

  const [perfectA, perfectB] = await Promise.all([
    getPerfectDaysForUser(userAId, dates),
    getPerfectDaysForUser(userBId, dates),
  ]);

  return computeTeamStreak(perfectA, perfectB, dates, today);
}
