import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { boredomPicks, habits, reactions } from "@/db/schema";
import { startOfDayInTz, toIsoDateInTz, todayIso } from "@/lib/date";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { getFrozenWeeksByHabit } from "@/lib/habits/get-freezes";
import { computeAchievements, type Achievement } from "./achievements";

function daysSince(date: Date): number {
  const diffMs =
    startOfDayInTz(todayIso()).getTime() -
    startOfDayInTz(toIsoDateInTz(date)).getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export async function getAchievementsForUser(
  userId: string,
): Promise<Achievement[]> {
  const userHabits = await db.query.habits.findMany({
    where: eq(habits.userId, userId),
  });
  const habitIds = userHabits.map((h) => h.id);
  const activeHabits = userHabits.filter((h) => h.status === "active");

  const completedEntries = habitIds.length
    ? await db.query.habitEntries.findMany({
        where: (e, { and, eq: eqOp }) =>
          and(inArray(e.habitId, habitIds), eqOp(e.completed, true)),
        columns: { habitId: true, date: true },
      })
    : [];

  const completedDatesByHabit = new Map<string, string[]>();
  for (const entry of completedEntries) {
    const list = completedDatesByHabit.get(entry.habitId) ?? [];
    list.push(entry.date);
    completedDatesByHabit.set(entry.habitId, list);
  }

  const frozenWeeksByHabit = await getFrozenWeeksByHabit(habitIds);
  const bestStreakEver = userHabits.reduce((max, habit) => {
    const streak = getHabitStreak(
      habit,
      completedDatesByHabit.get(habit.id) ?? [],
      frozenWeeksByHabit.get(habit.id) ?? [],
    );
    return Math.max(max, streak.maxStreak);
  }, 0);

  const oldestActiveHabitDays = activeHabits.reduce(
    (max, habit) => Math.max(max, daysSince(habit.createdAt)),
    0,
  );

  const ideaPicks = await db.query.boredomPicks.findMany({
    where: eq(boredomPicks.userId, userId),
    columns: { id: true },
  });

  const reactionRows = habitIds.length
    ? await db.query.reactions.findMany({
        where: or(
          eq(reactions.fromUserId, userId),
          inArray(reactions.habitId, habitIds),
        ),
        columns: { id: true },
      })
    : await db.query.reactions.findMany({
        where: eq(reactions.fromUserId, userId),
        columns: { id: true },
      });

  return computeAchievements({
    totalCompletedEntries: completedEntries.length,
    bestStreakEver,
    activeHabitCount: activeHabits.length,
    oldestActiveHabitDays,
    ideaPicksCount: ideaPicks.length,
    reactionsCount: reactionRows.length,
  });
}
