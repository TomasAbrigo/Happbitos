import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { annotations, habitEntries, habits, reactions } from "@/db/schema";
import { toIsoDateInTz, todayIso } from "@/lib/date";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getHabitStreak } from "@/lib/habits/get-habit-streak";
import { getFreezeQuotaRemaining, getFrozenWeeksByHabit } from "@/lib/habits/get-freezes";
import { habitColorClass } from "@/lib/habits/appearance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailHeader } from "@/components/app-header";
import { FreezeButton } from "@/components/habits/freeze-button";
import { HabitAnnotations } from "@/components/habits/habit-annotations";
import {
  HabitHeatmap,
  habitCompletionRate,
} from "@/components/habits/habit-heatmap";
import { StreakCelebration } from "@/components/habits/streak-celebration";
import { StreakPills } from "@/components/habits/streak-pills";

function typeLabel(habit: { type: string; target: number | null }) {
  if (habit.type === "binary") return "Binario";
  return `Meta: ${habit.target}`;
}

function frequencyLabel(habit: {
  frequencyKind: string;
  timesPerWeek: number | null;
}) {
  if (habit.frequencyKind === "daily") return "Todos los días";
  return `${habit.timesPerWeek}x por semana`;
}

const weekFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatWeekStart(iso: string) {
  return `Sem. del ${weekFormatter.format(new Date(`${iso}T00:00:00.000Z`))}`;
}

const REACTION_TONES = [
  "bg-accent text-accent-foreground",
  "bg-card ring-1 ring-border",
  "bg-success/15 text-success ring-1 ring-success/30",
  "bg-card ring-1 ring-border",
];

function reactionTone(sticker: string) {
  let hash = 0;
  for (let i = 0; i < sticker.length; i++) {
    hash = (hash * 31 + sticker.charCodeAt(i)) >>> 0;
  }
  return REACTION_TONES[hash % REACTION_TONES.length];
}

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

  const frozenWeeksByHabit = await getFrozenWeeksByHabit([habit.id]);
  const streak = getHabitStreak(
    habit,
    [...completedDates],
    frozenWeeksByHabit.get(habit.id) ?? [],
  );
  const freezeQuotaRemaining = await getFreezeQuotaRemaining(user.id);
  const habitCreatedAt = toIsoDateInTz(habit.createdAt);
  const completionRate = habitCompletionRate(completedDates, missedDates);

  const habitAnnotations = await db.query.annotations.findMany({
    where: eq(annotations.habitId, habit.id),
  });
  const annotationByDate = new Map(
    habitAnnotations.map((a) => [a.date, a.text]),
  );
  const today = todayIso();
  const notableDates = new Set(missedDates);
  if (today >= habitCreatedAt) notableDates.add(today);

  const daysWithNotes = [...notableDates]
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => ({
      date,
      text: annotationByDate.get(date) ?? null,
      completed: completedDates.has(date),
    }));

  const receivedReactions = await db.query.reactions.findMany({
    where: eq(reactions.habitId, habit.id),
    orderBy: (r, { desc }) => [desc(r.weekStart)],
  });
  const allUsers = await db.query.users.findMany({
    columns: { id: true, username: true },
  });
  const usernameById = new Map(allUsers.map((u) => [u.id, u.username]));

  return (
    <div className="flex min-h-screen flex-col items-center">
      <DetailHeader backHref="/" backLabel="Volver a tus hábitos" />

      <div className="flex w-full max-w-6xl flex-col gap-4 p-4 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading flex items-center gap-2 text-2xl font-bold break-words md:text-3xl">
              {habit.color && (
                <span
                  className={`size-3 shrink-0 rounded-full ${habitColorClass(habit.color)}`}
                />
              )}
              {habit.icon && <span>{habit.icon}</span>}
              {habit.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {typeLabel(habit)} · {frequencyLabel(habit)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StreakCelebration habitId={habit.id} currentStreak={streak.currentStreak}>
              <StreakPills current={streak.currentStreak} max={streak.maxStreak} />
            </StreakCelebration>
            <FreezeButton habitId={habit.id} quotaRemaining={freezeQuotaRemaining} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">Historial</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Últimas 20 semanas de actividad diaria
                </p>
              </div>
              <span className="text-success text-sm font-semibold">
                {Math.round(completionRate * 100)}% cumplido
              </span>
            </CardHeader>
            <CardContent>
              <HabitHeatmap
                completedDates={completedDates}
                missedDates={missedDates}
                habitCreatedAt={habitCreatedAt}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reacciones recibidas</CardTitle>
              </CardHeader>
              <CardContent>
                {receivedReactions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Silencio absoluto. Nadie te bancó todavía.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {receivedReactions.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${reactionTone(r.sticker)}`}
                        >
                          {r.sticker}
                        </span>
                        <span className="text-muted-foreground text-right text-xs">
                          {usernameById.get(r.fromUserId) ?? "?"}
                          <br />
                          {formatWeekStart(r.weekStart)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Hoy y los días no cumplidos, por si querés dejar algo
                  anotado.
                </p>
              </CardHeader>
              <CardContent>
                <HabitAnnotations habitId={habit.id} days={daysWithNotes} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
