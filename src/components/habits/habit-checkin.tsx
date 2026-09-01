"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  logHabitEntry,
  type EntryFormState,
} from "@/app/habits/entries-actions";

const initialState: EntryFormState = { error: null };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function HabitCheckin({
  habitId,
  type,
  todayEntry,
}: {
  habitId: string;
  type: "binary" | "quantity";
  todayEntry: { completed: boolean; quantity: number | null } | undefined;
}) {
  const action = logHabitEntry.bind(null, habitId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="date" value={todayIso()} />

      {type === "binary" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="completed"
            defaultChecked={todayEntry?.completed ?? false}
            className="size-4"
          />
          Hoy
        </label>
      ) : (
        <Input
          type="number"
          name="quantity"
          min={0}
          defaultValue={todayEntry?.quantity ?? undefined}
          placeholder="Cantidad de hoy"
          className="h-8 w-32"
        />
      )}

      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "..." : "Guardar"}
      </Button>

      {state.error && (
        <span className="text-destructive text-xs">{state.error}</span>
      )}
    </form>
  );
}
