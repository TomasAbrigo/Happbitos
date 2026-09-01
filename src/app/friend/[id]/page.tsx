import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { annotations, habitEntries, habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOtherUser } from "@/lib/auth/other-user";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { Badge } from "@/components/ui/badge";
import { HabitHeatmap } from "@/components/habits/habit-heatmap";

export default async function FriendHabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const friend = await getOtherUser(user.id);
  if (!friend) notFound();

  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, id), eq(habits.userId, friend.id)),
  });
  if (!habit) notFound();

  const entries = await db.query.habitEntries.findMany({
    where: eq(habitEntries.habitId, habit.id),
  });
  const completedDates = new Set(
    entries.filter((e) => e.completed).map((e) => e.date),
  );
  const missedDates = new Set(
    entries.filter((e) => !e.completed).map((e) => e.date),
  );

  const streak = getHabitStreak(habit, [...completedDates]);
  const habitCreatedAt = habit.createdAt.toISOString().slice(0, 10);

  const habitAnnotations = await db.query.annotations.findMany({
    where: eq(annotations.habitId, habit.id),
  });

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Link href="/friend" className="text-muted-foreground text-sm">
          ← Volver
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {habit.name} <span className="text-muted-foreground text-sm">({friend.username})</span>
          </h1>
          <div className="flex gap-2">
            <Badge>Racha: {streak.currentStreak} sem.</Badge>
            <Badge variant="outline">Máx: {streak.maxStreak} sem.</Badge>
          </div>
        </div>

        <HabitHeatmap
          completedDates={completedDates}
          missedDates={missedDates}
          habitCreatedAt={habitCreatedAt}
        />

        <div>
          <h2 className="mb-2 text-lg font-medium">Notas de días no cumplidos</h2>
          {habitAnnotations.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin notas.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {habitAnnotations
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((a) => (
                  <li key={a.id} className="flex gap-2">
                    <span className="text-muted-foreground w-24 shrink-0">
                      {a.date}
                    </span>
                    <span>{a.text}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
