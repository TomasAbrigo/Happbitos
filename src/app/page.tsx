import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { HabitList } from "@/components/habits/habit-list";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return null;

  const activeHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, user.id), eq(habits.status, "active")),
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

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-md items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">HAppbitos</h1>
          <p className="text-muted-foreground text-sm">Hola, {user.username}.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            render={<Link href="/friend" />}
          >
            Progreso del otro
          </Button>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Salir
            </Button>
          </form>
        </div>
      </div>

      <HabitList
        habits={activeHabits}
        todayEntries={todayEntries}
        streaksByHabit={streaksByHabit}
      />
    </div>
  );
}
