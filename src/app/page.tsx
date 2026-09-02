import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries, habits, reactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { PrimaryHeader } from "@/components/app-header";
import { ArchivedHabits } from "@/components/habits/archived-habits";
import { HabitList } from "@/components/habits/habit-list";

const RECENT_WEEKS = 10;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function currentWeekStartIso() {
  const date = new Date();
  const dayOfWeek = date.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return null;

  const activeHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, user.id), eq(habits.status, "active")),
    orderBy: (h, { asc }) => [asc(h.createdAt)],
  });

  const archivedHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, user.id), eq(habits.status, "archived")),
    orderBy: (h, { asc }) => [asc(h.createdAt)],
  });

  const today = todayIso();
  const habitIds = activeHabits.map((h) => h.id);
  const todayEntriesList = habitIds.length
    ? await db.query.habitEntries.findMany({
        where: and(
          inArray(habitEntries.habitId, habitIds),
          eq(habitEntries.date, today),
        ),
      })
    : [];
  const todayEntries = new Map(todayEntriesList.map((e) => [e.habitId, e]));

  const allCompletedEntries = habitIds.length
    ? await db.query.habitEntries.findMany({
        where: and(
          inArray(habitEntries.habitId, habitIds),
          eq(habitEntries.completed, true),
        ),
      })
    : [];
  const completedDatesByHabit = new Map<string, string[]>();
  for (const entry of allCompletedEntries) {
    const list = completedDatesByHabit.get(entry.habitId) ?? [];
    list.push(entry.date);
    completedDatesByHabit.set(entry.habitId, list);
  }
  const streaksByHabit = new Map(
    activeHabits.map((habit) => [
      habit.id,
      getHabitStreak(habit, completedDatesByHabit.get(habit.id) ?? []),
    ]),
  );

  const recentSince = daysAgoIso(RECENT_WEEKS * 7);
  const recentEntries = habitIds.length
    ? await db.query.habitEntries.findMany({
        where: and(
          inArray(habitEntries.habitId, habitIds),
          gte(habitEntries.date, recentSince),
        ),
      })
    : [];
  const recentActivityByHabit = new Map<
    string,
    { completedDates: Set<string>; missedDates: Set<string> }
  >();
  for (const habit of activeHabits) {
    recentActivityByHabit.set(habit.id, {
      completedDates: new Set(),
      missedDates: new Set(),
    });
  }
  for (const entry of recentEntries) {
    const bucket = recentActivityByHabit.get(entry.habitId);
    if (!bucket) continue;
    (entry.completed ? bucket.completedDates : bucket.missedDates).add(
      entry.date,
    );
  }

  const doneToday = activeHabits.filter(
    (h) => todayEntries.get(h.id)?.completed,
  ).length;

  const weekReactions = habitIds.length
    ? await db.query.reactions.findMany({
        where: and(
          inArray(reactions.habitId, habitIds),
          eq(reactions.weekStart, currentWeekStartIso()),
        ),
      })
    : [];
  const habitNameById = new Map(activeHabits.map((h) => [h.id, h.name]));
  const reactedHabitNames = [
    ...new Set(
      weekReactions
        .map((r) => habitNameById.get(r.habitId))
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  return (
    <div className="flex min-h-screen flex-col items-center">
      <PrimaryHeader username={user.username} />

      <div className="flex w-full max-w-4xl flex-col gap-8 p-4 md:p-8">
        <HabitList
          habits={activeHabits}
          todayEntries={todayEntries}
          streaksByHabit={streaksByHabit}
          recentActivityByHabit={recentActivityByHabit}
          doneToday={doneToday}
          reactionCount={weekReactions.length}
          reactedHabitNames={reactedHabitNames}
        />
        <ArchivedHabits habits={archivedHabits} />
      </div>
    </div>
  );
}
