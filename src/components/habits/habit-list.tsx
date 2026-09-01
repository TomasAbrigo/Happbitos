import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { archiveHabit, createHabit, updateHabit } from "@/app/habits/actions";
import type { habitEntries, habits } from "@/db/schema";
import type { StreakResult } from "@/lib/habits/streak";
import { HabitCheckin } from "./habit-checkin";
import { HabitDialog } from "./habit-dialog";

type Habit = typeof habits.$inferSelect;
type HabitEntry = typeof habitEntries.$inferSelect;

function frequencyLabel(habit: Habit) {
  if (habit.frequencyKind === "daily") return "Todos los días";
  return `${habit.timesPerWeek}x por semana`;
}

function typeLabel(habit: Habit) {
  if (habit.type === "binary") return "Binario";
  return `Meta: ${habit.target}`;
}

export function HabitList({
  habits: items,
  todayEntries,
  streaksByHabit,
}: {
  habits: Habit[];
  todayEntries: Map<string, HabitEntry>;
  streaksByHabit: Map<string, StreakResult>;
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Tus hábitos</h2>
        <HabitDialog
          title="Nuevo hábito"
          submitLabel="Crear"
          action={createHabit}
          trigger={<Button size="sm">+ Nuevo</Button>}
        />
      </div>

      {items.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Todavía no creaste ningún hábito.
        </p>
      )}

      {items.map((habit) => (
        <Card key={habit.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle className="text-base">
              <Link href={`/habits/${habit.id}`} className="hover:underline">
                {habit.name}
              </Link>
            </CardTitle>
            <div className="flex gap-2">
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
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                }
              />
              <form action={archiveHabit.bind(null, habit.id)}>
                <Button size="sm" variant="ghost" type="submit">
                  Archivar
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{typeLabel(habit)}</Badge>
              <Badge variant="secondary">{frequencyLabel(habit)}</Badge>
              <Badge>
                Racha: {streaksByHabit.get(habit.id)?.currentStreak ?? 0} sem.
              </Badge>
              <Badge variant="outline">
                Máx: {streaksByHabit.get(habit.id)?.maxStreak ?? 0} sem.
              </Badge>
            </div>
            <HabitCheckin
              habitId={habit.id}
              type={habit.type}
              todayEntry={todayEntries.get(habit.id)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
