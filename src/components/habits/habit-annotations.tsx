"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setAnnotation,
  type AnnotationFormState,
} from "@/app/habits/annotations-actions";

const initialState: AnnotationFormState = { error: null };

function AnnotationRow({
  habitId,
  date,
  text,
}: {
  habitId: string;
  date: string;
  text: string | null;
}) {
  const action = setAnnotation.bind(null, habitId, date);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <span className="text-muted-foreground w-24 shrink-0 text-xs">
        {date}
      </span>
      <Input
        name="text"
        defaultValue={text ?? ""}
        placeholder="¿Qué pasó este día?"
        className="h-8"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "..." : "Guardar"}
      </Button>
      {state.error && (
        <span className="text-destructive text-xs">{state.error}</span>
      )}
    </form>
  );
}

export function HabitAnnotations({
  habitId,
  missedDates,
}: {
  habitId: string;
  missedDates: { date: string; text: string | null }[];
}) {
  if (missedDates.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavía no hay días no cumplidos para anotar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {missedDates.map(({ date, text }) => (
        <AnnotationRow key={date} habitId={habitId} date={date} text={text} />
      ))}
    </div>
  );
}
