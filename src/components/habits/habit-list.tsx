import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveHabit, createHabit, updateHabit } from "@/app/habits/actions";
import type { habitEntries, habits } from "@/db/schema";
import type { StreakResult } from "@/lib/habits/streak";
import { getTodayProgressQuip } from "@/lib/habits/streak-flavor";
import { HabitCheckin } from "./habit-checkin";
import { HabitDialog } from "./habit-dialog";
import { HabitHeatmap } from "./habit-heatmap";
import { StreakPills } from "./streak-pills";

type Habit = typeof habits.$inferSelect;
type HabitEntry = typeof habitEntries.$inferSelect;
type RecentActivity = { completedDates: Set<string>; missedDates: Set<string> };

function frequencyLabel(habit: Habit) {
  if (habit.frequencyKind === "daily") return "Todos los días";
  return `${habit.timesPerWeek}x por semana`;
}

function typeLabel(habit: Habit) {
  if (habit.type === "binary") return "Binario";
  return `Meta: ${habit.target}`;
}

function TodayProgress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="bg-card ring-foreground/10 flex items-center gap-4 rounded-xl px-4 py-3 ring-1">
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium">
          Hoy
        </span>
        <span className="font-heading text-2xl leading-none font-bold">
          {done}/{total}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-success h-full rounded-full transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-muted-foreground text-xs">
          {getTodayProgressQuip(done, total)}
        </span>
      </div>
    </div>
  );
}

export function HabitList({
  habits: items,
  todayEntries,
  streaksByHabit,
  recentActivityByHabit,
  doneToday,
}: {
  habits: Habit[];
  todayEntries: Map<string, HabitEntry>;
  streaksByHabit: Map<string, StreakResult>;
  recentActivityByHabit: Map<string, RecentActivity>;
  doneToday: number;
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Tus hábitos</h1>
          <p className="text-muted-foreground text-sm">
            {items.length} en juego. Marcá el de hoy antes de que se te
            escape.
          </p>
        </div>
        <HabitDialog
          title="Nuevo hábito"
          description="Sumá una más. Después no digas que no avisamos."
          submitLabel="Crear"
          action={createHabit}
          trigger={<Button size="sm">+ Nuevo</Button>}
        />
      </div>

      {items.length > 0 && (
        <TodayProgress done={doneToday} total={items.length} />
      )}

      {items.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Ni un hábito todavía. ¿Vamos a arrancar o esto es solo para mirarlo
          fijo?
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((habit) => {
          const streak = streaksByHabit.get(habit.id) ?? {
            currentStreak: 0,
            maxStreak: 0,
          };
          const activity = recentActivityByHabit.get(habit.id) ?? {
            completedDates: new Set<string>(),
            missedDates: new Set<string>(),
          };
          const doneTodayHabit = todayEntries.get(habit.id)?.completed;
          return (
            <Card
              key={habit.id}
              className={
                doneTodayHabit ? "ring-success/40 bg-success/5 ring-2" : ""
              }
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <Link
                  href={`/habits/${habit.id}`}
                  className="min-w-0 flex-1 hover:underline"
                >
                  <CardTitle className="text-base">{habit.name}</CardTitle>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <HabitDialog
                    title="Editar hábito"
                    submitLabel="Guardar"
                    action={updateHabit.bind(null, habit.id)}
                    defaultValues={{
                      name: habit.name,
                      type: habit.type,
                      target: habit.target,
                      frequencyKind: habit.frequencyKind,
                      timesPerWeek: habit.timesPerWeek,
                    }}
                    trigger={
                      <button
                        type="button"
                        className="text-muted-foreground text-xs font-medium hover:text-foreground"
                      >
                        Editar
                      </button>
                    }
                  />
                  <form action={archiveHabit.bind(null, habit.id)}>
                    <button
                      type="submit"
                      className="text-muted-foreground text-xs font-medium hover:text-foreground"
                    >
                      Archivar
                    </button>
                  </form>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{typeLabel(habit)}</Badge>
                  <Badge variant="secondary">{frequencyLabel(habit)}</Badge>
                </div>

                <StreakPills current={streak.currentStreak} max={streak.maxStreak} />

                <Link
                  href={`/habits/${habit.id}`}
                  className="-mx-1 rounded-lg px-1 py-0.5 hover:bg-muted/60"
                  title="Ver historial completo"
                >
                  <HabitHeatmap
                    completedDates={activity.completedDates}
                    missedDates={activity.missedDates}
                    habitCreatedAt={habit.createdAt.toISOString().slice(0, 10)}
                    weeks={10}
                    showMonthLabels={false}
                    showLegend={false}
                  />
                </Link>

                <HabitCheckin
                  habitId={habit.id}
                  type={habit.type}
                  todayEntry={todayEntries.get(habit.id)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
