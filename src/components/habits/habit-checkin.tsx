"use client";

import { Check } from "lucide-react";
import { useActionState, useState } from "react";
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
  const [editing, setEditing] = useState(false);

  if (todayEntry?.completed && !editing) {
    return (
      <div className="bg-success/15 animate-in fade-in zoom-in-95 flex w-full items-center justify-between rounded-lg px-3 py-2 duration-300">
        <span className="text-success flex items-center gap-1.5 text-sm font-medium">
          <Check className="animate-in zoom-in spin-in-45 size-4 duration-300" strokeWidth={3} />
          Hecho por hoy
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-success/80 text-xs underline-offset-2 hover:underline"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="date" value={todayIso()} />

      {type === "binary" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="completed"
            defaultChecked={todayEntry?.completed ?? false}
            className="accent-primary size-4"
          />
          Marcá que lo hiciste hoy
        </label>
      ) : (
        <Input
          type="number"
          name="quantity"
          min={0}
          defaultValue={todayEntry?.quantity ?? undefined}
          placeholder="Cantidad de hoy"
          className="h-9 w-32"
        />
      )}

      <Button type="submit" size="sm" variant="accent" disabled={pending}>
        {pending ? "..." : "Guardar"}
      </Button>

      {state.error && (
        <span className="text-destructive text-xs">{state.error}</span>
      )}
    </form>
  );
}
