"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMissedDayQuip } from "@/lib/habits/streak-flavor";
import {
  setAnnotation,
  type AnnotationFormState,
} from "@/app/habits/annotations-actions";

const initialState: AnnotationFormState = { error: null };

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function formatDate(iso: string) {
  const formatted = dateFormatter.format(new Date(`${iso}T00:00:00.000Z`));
  return formatted.slice(0, 1).toUpperCase() + formatted.slice(1);
}

function AnnotationRow({
  habitId,
  date,
  text,
  completed,
}: {
  habitId: string;
  date: string;
  text: string | null;
  completed: boolean;
}) {
  const action = setAnnotation.bind(null, habitId, date);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0">
        <div>
          <p className="text-sm font-medium">
            {completed ? "✅ " : ""}
            {formatDate(date)}
          </p>
          <p className="text-muted-foreground text-xs">
            {text ?? (completed ? "Sin nota" : getMissedDayQuip(date))}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-muted-foreground shrink-0 text-xs underline-offset-2 hover:underline"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 border-b py-2 last:border-b-0"
    >
      <span className="text-sm font-medium">{formatDate(date)}</span>
      <div className="flex items-center gap-2">
        <Input
          name="text"
          defaultValue={text ?? ""}
          placeholder={
            completed ? "Contá algo de este día (opcional)" : "¿Cuál es la excusa?"
          }
          className="h-9"
          autoFocus
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "..." : "Guardar"}
        </Button>
      </div>
      {state.error && (
        <span className="text-destructive text-xs">{state.error}</span>
      )}
    </form>
  );
}

export function HabitAnnotations({
  habitId,
  days,
}: {
  habitId: string;
  days: { date: string; text: string | null; completed: boolean }[];
}) {
  if (days.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavía no hay nada para anotar acá.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {days.map(({ date, text, completed }) => (
        <AnnotationRow
          key={date}
          habitId={habitId}
          date={date}
          text={text}
          completed={completed}
        />
      ))}
    </div>
  );
}
