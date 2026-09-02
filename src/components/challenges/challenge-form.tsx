"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChallenge, type ChallengeFormState } from "@/app/challenges/actions";

const initialState: ChallengeFormState = { error: null };

const DURATIONS = [7, 14, 21, 30, 60, 90];

export function ChallengeForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(
    createChallenge,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  if (disabled) {
    return (
      <p className="text-muted-foreground text-sm">
        Necesitás que el otro usuario esté activo para armar un desafío.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-card ring-foreground/10 flex flex-wrap items-end gap-2 rounded-xl p-3 ring-1"
    >
      <div className="flex min-w-48 flex-1 flex-col gap-1.5">
        <label htmlFor="title" className="text-muted-foreground text-xs font-medium">
          Nuevo desafío
        </label>
        <Input
          id="title"
          name="title"
          placeholder="Ej: 30 días sin fumar"
          className="h-9"
          maxLength={120}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="duration" className="text-muted-foreground text-xs font-medium">
          Duración
        </label>
        <select
          id="duration"
          name="duration"
          defaultValue={30}
          className="h-9 rounded-lg border border-transparent bg-muted px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {DURATIONS.map((d) => (
            <option key={d} value={d}>
              {d} días
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "..." : "Proponer"}
      </Button>
      {state.error && (
        <span className="text-destructive w-full text-xs">{state.error}</span>
      )}
    </form>
  );
}
