"use client";

import { useActionState } from "react";
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

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
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
