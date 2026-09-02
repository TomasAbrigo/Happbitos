"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HABIT_COLORS, HABIT_ICONS } from "@/lib/habits/appearance";
import { HABIT_TEMPLATES } from "@/lib/habits/templates";
import { cn } from "@/lib/utils";
import type { HabitFormState } from "@/app/habits/actions";

export type HabitFormDefaultValues = {
  name: string;
  type: "binary" | "quantity";
  target: number | null;
  frequencyKind: "daily" | "n_per_week";
  timesPerWeek: number | null;
  icon?: string | null;
  color?: string | null;
};

type HabitFormProps = {
  action: (state: HabitFormState, formData: FormData) => Promise<HabitFormState>;
  defaultValues?: HabitFormDefaultValues;
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
  const [icon, setIcon] = useState(defaultValues?.icon ?? "");
  const [color, setColor] = useState(defaultValues?.color ?? "");
  const [name, setName] = useState(defaultValues?.name ?? "");

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
      {!defaultValues && (
        <div className="flex flex-col gap-2">
          <Label>Ideas rápidas</Label>
          <div className="flex flex-wrap gap-1.5">
            {HABIT_TEMPLATES.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => {
                  setName(template.name);
                  setIcon(template.icon);
                }}
                className="bg-muted/50 hover:bg-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              >
                <span>{template.icon}</span>
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Ícono</Label>
        <input type="hidden" name="icon" value={icon} />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setIcon("")}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg border text-sm",
              icon === ""
                ? "border-ring bg-muted"
                : "border-transparent bg-muted/50 hover:bg-muted",
            )}
            aria-label="Sin ícono"
          >
            —
          </button>
          {HABIT_ICONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setIcon(option)}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border text-lg",
                icon === option
                  ? "border-ring bg-muted"
                  : "border-transparent bg-muted/50 hover:bg-muted",
              )}
              aria-label={`Ícono ${option}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <input type="hidden" name="color" value={color} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setColor("")}
            className={cn(
              "bg-muted flex size-8 items-center justify-center rounded-full border-2 text-xs",
              color === "" ? "border-ring" : "border-transparent",
            )}
            aria-label="Sin color"
          >
            —
          </button>
          {HABIT_COLORS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setColor(option.id)}
              className={cn(
                "size-8 rounded-full border-2",
                option.className,
                color === option.id ? "border-ring" : "border-transparent",
              )}
              aria-label={option.label}
              title={option.label}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="h-11 rounded-lg border border-transparent bg-muted px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
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
          className="h-11 rounded-lg border border-transparent bg-muted px-3.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
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
