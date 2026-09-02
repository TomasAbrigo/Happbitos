"use client";

import { Snowflake } from "lucide-react";
import { useState, useTransition } from "react";
import { applyFreeze } from "@/app/habits/actions";

export function FreezeButton({
  habitId,
  quotaRemaining,
}: {
  habitId: string;
  quotaRemaining: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(false);

  if (used) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Snowflake className="size-3.5" />
        Comodín usado esta semana
      </span>
    );
  }

  if (quotaRemaining <= 0) return null;

  function handleClick() {
    startTransition(async () => {
      const result = await applyFreeze(habitId);
      if (result.error) setError(result.error);
      else setUsed(true);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium hover:text-foreground"
        title="Perdona esta semana sin romper la racha"
      >
        <Snowflake className="size-3.5" />
        {pending ? "..." : `Usar comodín (${quotaRemaining} este mes)`}
      </button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  );
}
