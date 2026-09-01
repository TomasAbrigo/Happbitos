import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { habitEntries, habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { Badge } from "@/components/ui/badge";
import { HabitHeatmap } from "@/components/habits/habit-heatmap";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, id), eq(habits.userId, user.id)),
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

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Link href="/" className="text-muted-foreground text-sm">
          ← Volver
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {habit.name}
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
      </div>
    </div>
  );
}
