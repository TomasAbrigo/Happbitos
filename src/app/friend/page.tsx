import { and, eq } from "drizzle-orm";
import { Eye } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { habits, reactions } from "@/db/schema";
import { currentWeekStartIso, toIsoDateInTz } from "@/lib/date";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFriends } from "@/lib/friends/get-friends";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { getFrozenWeeksByHabit } from "@/lib/habits/get-freezes";
import { habitColorClass } from "@/lib/habits/appearance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailHeader } from "@/components/app-header";
import { HabitHeatmap } from "@/components/habits/habit-heatmap";
import { StreakPills } from "@/components/habits/streak-pills";
import { ReactionPicker } from "@/components/reactions/reaction-picker";

export default async function FriendPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const friends = await getFriends(user.id);
  if (friends.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-8">
        <p className="text-muted-foreground text-sm">
          Acá se supone que iba tu compañero de ruta, pero está solo.
        </p>
        <Link href="/" className="text-sm underline">
          Volver
        </Link>
      </div>
    );
  }

  const { id } = await searchParams;
  const friend = friends.find((f) => f.id === id) ?? friends[0];

  const friendHabits = await db.query.habits.findMany({
    where: and(eq(habits.userId, friend.id), eq(habits.status, "active")),
    orderBy: (h, { asc }) => [asc(h.createdAt)],
  });

  const weekStart = currentWeekStartIso();

  const habitDetails = await Promise.all(
    friendHabits.map(async (habit) => {
      const entries = await db.query.habitEntries.findMany({
        where: (e, { eq: eqOp }) => eqOp(e.habitId, habit.id),
      });
      const completedDates = new Set(
        entries.filter((e) => e.completed).map((e) => e.date),
      );
      const missedDates = new Set(
        entries.filter((e) => !e.completed).map((e) => e.date),
      );
      const frozenWeeks = await getFrozenWeeksByHabit([habit.id]);
      const streak = getHabitStreak(
        habit,
        [...completedDates],
        frozenWeeks.get(habit.id) ?? [],
      );
      const myReactionThisWeek = await db.query.reactions.findFirst({
        where: and(
          eq(reactions.habitId, habit.id),
          eq(reactions.fromUserId, user.id),
          eq(reactions.weekStart, weekStart),
        ),
      });
      return {
        habit,
        completedDates,
        missedDates,
        streak,
        currentSticker: myReactionThisWeek?.sticker ?? null,
      };
    }),
  );

  return (
    <div className="flex min-h-screen flex-col items-center">
      <DetailHeader
        backHref="/"
        backLabel="Volver a tus hábitos"
        right={
          <span className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
            <Eye className="size-3.5" />
            Solo lectura
          </span>
        }
      />

      <div className="flex w-full max-w-6xl flex-col gap-4 p-4 md:p-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            Progreso de {friend.username}
          </h1>
          <p className="text-muted-foreground text-sm">
            Mirá lo que hace el otro. Tocar no podés, pero bancarlo con un
            sticker sí.
          </p>
        </div>

        {friends.length > 1 && (
          <nav className="flex flex-wrap gap-2">
            {friends.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={f.id === friend.id ? "default" : "outline"}
                nativeButton={false}
                render={<Link href={`/friend?id=${f.id}`} />}
              >
                {f.username}
              </Button>
            ))}
          </nav>
        )}

        {friendHabits.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {friend.username} anda de vago: cero hábitos activos.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {habitDetails.map(
            ({ habit, completedDates, missedDates, streak, currentSticker }) => (
              <Card key={habit.id}>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex min-w-0 items-center gap-2 text-lg break-words">
                    {habit.color && (
                      <span
                        className={`size-2.5 shrink-0 rounded-full ${habitColorClass(habit.color)}`}
                      />
                    )}
                    {habit.icon && <span className="shrink-0">{habit.icon}</span>}
                    {habit.name}
                  </CardTitle>
                  <StreakPills
                    current={streak.currentStreak}
                    max={streak.maxStreak}
                  />
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <HabitHeatmap
                      completedDates={completedDates}
                      missedDates={missedDates}
                      habitCreatedAt={toIsoDateInTz(habit.createdAt)}
                      showMonthLabels={false}
                      showLegend={false}
                    />
                  </div>
                  <ReactionPicker
                    habitId={habit.id}
                    weekStart={weekStart}
                    currentSticker={currentSticker}
                  />
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
