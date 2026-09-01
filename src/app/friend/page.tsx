import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { habits } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOtherUser } from "@/lib/auth/other-user";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function frequencyLabel(habit: { frequencyKind: string; timesPerWeek: number | null }) {
  if (habit.frequencyKind === "daily") return "Todos los días";
  return `${habit.timesPerWeek}x por semana`;
}

export default async function FriendPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const friend = await getOtherUser(user.id);
  if (!friend) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
        <p className="text-muted-foreground text-sm">
          Todavía no hay otro usuario en la app.
        </p>
        <Link href="/" className="text-sm underline">
          Volver
        </Link>
      </div>
    );
  }

  const friendHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, friend.id), eq(habits.status, "active")),
    orderBy: (h, { asc }) => [asc(h.createdAt)],
  });

  const streaksByHabit = new Map(
    await Promise.all(
      friendHabits.map(async (habit) => {
        const entries = await db.query.habitEntries.findMany({
          where: (e, { and: a, eq: eqOp }) =>
            a(eqOp(e.habitId, habit.id), eqOp(e.completed, true)),
        });
        return [
          habit.id,
          getHabitStreak(habit, entries.map((e) => e.date)),
        ] as const;
      }),
    ),
  );

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Link href="/" className="text-muted-foreground text-sm">
          ← Volver
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Progreso de {friend.username}
        </h1>

        {friendHabits.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {friend.username} todavía no tiene hábitos activos.
          </p>
        )}

        {friendHabits.map((habit) => {
          const streak = streaksByHabit.get(habit.id);
          return (
            <Card key={habit.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  <Link href={`/friend/${habit.id}`} className="hover:underline">
                    {habit.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="secondary">{frequencyLabel(habit)}</Badge>
                <Badge>Racha: {streak?.currentStreak ?? 0} sem.</Badge>
                <Badge variant="outline">Máx: {streak?.maxStreak ?? 0} sem.</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
