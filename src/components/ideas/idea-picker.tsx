"use client";

import { Sparkles } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markIdeaDone, pickIdeaAction, type PickState } from "@/app/ideas/actions";

const initialState: PickState = { idea: null, error: null };

export function IdeaPicker() {
  const [state, formAction, pending] = useActionState(
    pickIdeaAction,
    initialState,
  );
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [justDoneText, setJustDoneText] = useState<string | null>(null);
  const [markPending, startMark] = useTransition();

  // Adjust state during render (React-endorsed pattern) instead of an
  // effect, so a freshly-picked idea is excluded from the next pick
  // without an extra render flash.
  const [trackedIdeaId, setTrackedIdeaId] = useState<string | null>(null);
  if (state.idea && state.idea.id !== trackedIdeaId) {
    setTrackedIdeaId(state.idea.id);
    setShownIds((prev) =>
      prev.includes(state.idea!.id) ? prev : [...prev, state.idea!.id],
    );
  }

  function handleDone() {
    if (!state.idea) return;
    const { id, text } = state.idea;
    startMark(async () => {
      await markIdeaDone(id);
      setJustDoneText(text);
    });
  }

  const showSuggestion = state.idea && !justDoneText;

  return (
    <div className="bg-card ring-foreground/10 flex flex-col items-center gap-4 rounded-xl p-6 text-center ring-1">
      {justDoneText && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-success text-2xl">🎉</p>
          <p className="font-heading text-lg font-bold">¡Hecho!</p>
          <p className="text-muted-foreground text-sm">{justDoneText}</p>
        </div>
      )}

      {showSuggestion && (
        <p className="font-heading text-2xl leading-snug font-bold">
          {state.idea!.text}
        </p>
      )}

      {!showSuggestion && !justDoneText && (
        <p className="text-muted-foreground text-sm">
          Un botón, una idea. Mejor que el scroll infinito.
        </p>
      )}

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <form
          action={formAction}
          onSubmit={() => setJustDoneText(null)}
        >
          <input type="hidden" name="exclude" value={shownIds.join(",")} />
          <Button type="submit" disabled={pending} size="lg">
            <Sparkles className="size-4" />
            {showSuggestion || justDoneText ? "Dame otra" : "Dame algo para hacer"}
          </Button>
        </form>

        {showSuggestion && (
          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={handleDone}
            disabled={markPending}
          >
            {markPending ? "..." : "Ya lo hice"}
          </Button>
        )}
      </div>
    </div>
  );
}
