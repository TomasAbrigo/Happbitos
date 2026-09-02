"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { STICKER_CATALOG } from "@/lib/reactions/catalog";
import {
  reactToHabit,
  type ReactionFormState,
} from "@/app/friend/reactions-actions";

const initialState: ReactionFormState = { error: null };

export function ReactionPicker({
  habitId,
  weekStart,
  currentSticker,
}: {
  habitId: string;
  weekStart: string;
  currentSticker: string | null;
}) {
  const action = reactToHabit.bind(null, habitId, weekStart);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [editing, setEditing] = useState(currentSticker === null);

  if (currentSticker && !editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">
          Le dejaste esta semana
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className="bg-accent text-accent-foreground rounded-full px-3 py-1.5 text-xs font-semibold">
            {currentSticker}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-muted-foreground text-xs underline-offset-2 hover:underline"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs">
        Tu reacción de esta semana
      </span>
      <div className="flex flex-wrap gap-1.5">
        {STICKER_CATALOG.map((sticker) => (
          <Button
            key={sticker}
            type="submit"
            name="sticker"
            value={sticker}
            size="sm"
            variant={sticker === currentSticker ? "default" : "outline"}
            disabled={pending}
          >
            {sticker}
          </Button>
        ))}
      </div>
      {state.error && (
        <span className="text-destructive text-xs">{state.error}</span>
      )}
    </form>
  );
}
