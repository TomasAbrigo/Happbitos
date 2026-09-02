"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteHabit, unarchiveHabit } from "@/app/habits/actions";
import type { habits } from "@/db/schema";

type Habit = typeof habits.$inferSelect;

function DeleteHabitButton({ habit }: { habit: Habit }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="text-destructive text-xs font-medium hover:underline"
          >
            Eliminar
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar &quot;{habit.name}&quot;?</DialogTitle>
          <DialogDescription>
            Se borra para siempre, junto con todo su historial, notas y
            reacciones. No hay vuelta atrás.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <form
            action={async () => {
              await deleteHabit(habit.id);
              setOpen(false);
            }}
          >
            <Button type="submit" variant="destructive">
              Sí, eliminar
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ArchivedHabits({ habits: items }: { habits: Habit[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-bold">Archivados</h2>
      <div className="flex flex-col gap-2">
        {items.map((habit) => (
          <div
            key={habit.id}
            className="bg-card ring-foreground/10 flex items-center justify-between rounded-xl px-4 py-3 text-sm ring-1"
          >
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
              {habit.icon && <span>{habit.icon}</span>}
              {habit.name}
            </span>
            <div className="flex items-center gap-3">
              <form action={unarchiveHabit.bind(null, habit.id)}>
                <button
                  type="submit"
                  className="text-xs font-medium hover:underline"
                >
                  Desarchivar
                </button>
              </form>
              <DeleteHabitButton habit={habit} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
