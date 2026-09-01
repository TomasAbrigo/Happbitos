"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HabitFormState } from "@/app/habits/actions";

type HabitFormProps = {
  action: (state: HabitFormState, formData: FormData) => Promise<HabitFormState>;
  defaultValues?: {
    name: string;
    type: "binary" | "quantity";
    target: number | null;
    frequencyKind: "daily" | "n_per_week";
    timesPerWeek: number | null;
  };
  submitLabel: string;
  onSuccess?: () => void;
};

const initialState: HabitFormState = { error: null };

export function HabitForm({
  action,
  defaultValues,
  submitLabel,
  onSuccess,
}: HabitFormProps) {
  const [type, setType] = useState(defaultValues?.type ?? "binary");
  const [frequencyKind, setFrequencyKind] = useState(
    defaultValues?.frequencyKind ?? "daily",
  );

  async function wrappedAction(state: HabitFormState, formData: FormData) {
    const result = await action(state, formData);
    if (!result.error) onSuccess?.();
    return result;
  }

  const [state, formAction, pending] = useActionState(
    wrappedAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="binary">Binario (hecho / no hecho)</option>
          <option value="quantity">Cantidad con meta</option>
        </select>
      </div>

      {type === "quantity" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="target">Meta</Label>
          <Input
            id="target"
            name="target"
            type="number"
            min={1}
            required
            defaultValue={defaultValues?.target ?? undefined}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="frequencyKind">Frecuencia</Label>
        <select
          id="frequencyKind"
          name="frequencyKind"
          value={frequencyKind}
          onChange={(e) =>
            setFrequencyKind(e.target.value as typeof frequencyKind)
          }
          className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="daily">Todos los días</option>
          <option value="n_per_week">N veces por semana</option>
        </select>
      </div>

      {frequencyKind === "n_per_week" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="timesPerWeek">Veces por semana</Label>
          <Input
            id="timesPerWeek"
            name="timesPerWeek"
            type="number"
            min={1}
            max={7}
            required
            defaultValue={defaultValues?.timesPerWeek ?? undefined}
          />
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
