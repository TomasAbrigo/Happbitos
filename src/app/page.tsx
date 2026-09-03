import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { habitEntries, habits, reactions } from "@/db/schema";
import { addDaysIso, currentWeekStartIso, todayIso } from "@/lib/date";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFriends } from "@/lib/friends/get-friends";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { getFreezeQuotaRemaining, getFrozenWeeksByHabit } from "@/lib/habits/get-freezes";
import { getTeamStreak } from "@/lib/habits/get-team-streak";
import type { PulseSide } from "@/lib/habits/team-pulse";
import { getAchievementsForUser } from "@/lib/achievements/get-achievements";
import { getWhoopStatus } from "@/lib/whoop/get-whoop-status";
import { PrimaryHeader } from "@/components/app-header";
import { AchievementsWidget } from "@/components/dashboard/achievements-widget";
import { TeamPulseWidget } from "@/components/dashboard/team-pulse-widget";
import { WhoopWidget } from "@/components/dashboard/whoop-widget";
import { ArchivedHabits } from "@/components/habits/archived-habits";
import { HabitList } from "@/components/habits/habit-list";

const RECENT_WEEKS = 10;

function daysAgoIso(days: number) {
  return addDaysIso(todayIso(), -days);
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
  const frozenWeeksByHabit = await getFrozenWeeksByHabit(habitIds);
  const streaksByHabit = new Map(
    activeHabits.map((habit) => [
      habit.id,
      getHabitStreak(
        habit,
        completedDatesByHabit.get(habit.id) ?? [],
        frozenWeeksByHabit.get(habit.id) ?? [],
      ),
    ]),
  );
  const freezeQuotaRemaining = await getFreezeQuotaRemaining(user.id);

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

  const friends = await getFriends(user.id);
  const friendPulses = await Promise.all(
    friends.map(async (friend) => {
      const teamStreak = await getTeamStreak(user.id, friend.id);
      const friendActiveHabits = await db.query.habits.findMany({
        where: and(eq(habits.userId, friend.id), eq(habits.status, "active")),
      });
      const friendHabitIds = friendActiveHabits.map((h) => h.id);
      const friendDoneToday = friendHabitIds.length
        ? await db.query.habitEntries.findMany({
            where: and(
              inArray(habitEntries.habitId, friendHabitIds),
              eq(habitEntries.date, today),
              eq(habitEntries.completed, true),
            ),
          })
        : [];
      const pulse: PulseSide = {
        username: friend.username,
        done: friendDoneToday.length,
        total: friendActiveHabits.length,
      };
      return { friendId: friend.id, pulse, teamStreak };
    }),
  );

  const achievements = await getAchievementsForUser(user.id);
  const whoopStatus = await getWhoopStatus(user.id);

  return (
    <div className="flex min-h-screen flex-col items-center">
      <PrimaryHeader username={user.username} />

      <div className="flex w-full max-w-6xl flex-col gap-8 p-4 md:p-8 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-8">
          <HabitList
            habits={activeHabits}
            todayEntries={todayEntries}
            streaksByHabit={streaksByHabit}
            recentActivityByHabit={recentActivityByHabit}
            doneToday={doneToday}
            reactionCount={weekReactions.length}
            reactedHabitNames={reactedHabitNames}
            freezeQuotaRemaining={freezeQuotaRemaining}
          />
          <ArchivedHabits habits={archivedHabits} />
        </div>

        <aside className="flex flex-col gap-4">
          {friendPulses.length === 0 ? (
            <TeamPulseWidget
              me={{ username: user.username, done: doneToday, total: activeHabits.length }}
              friend={null}
              teamStreak={undefined}
            />
          ) : (
            friendPulses.map(({ friendId, pulse, teamStreak }) => (
              <TeamPulseWidget
                key={friendId}
                me={{ username: user.username, done: doneToday, total: activeHabits.length }}
                friend={pulse}
                teamStreak={teamStreak}
              />
            ))
          )}
          <AchievementsWidget achievements={achievements} />
          <WhoopWidget status={whoopStatus} />
        </aside>
      </div>
    </div>
  );
}
