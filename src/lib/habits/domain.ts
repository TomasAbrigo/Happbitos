export type HabitFrequency =
  | { kind: "daily" }
  | { kind: "n_per_week"; timesPerWeek: number };

export type HabitInput = {
  name: string;
  type: "binary" | "quantity";
  target?: number;
  frequency: HabitFrequency;
};

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export function validateHabitInput(input: HabitInput): ValidationResult {
  const errors: string[] = [];

  if (input.name.trim().length === 0) {
    errors.push("El nombre es requerido.");
  }

  if (input.type === "quantity" && (!input.target || input.target <= 0)) {
    errors.push("La meta numérica es requerida para hábitos de cantidad.");
  }

  if (
    input.frequency.kind === "n_per_week" &&
    (input.frequency.timesPerWeek < 1 || input.frequency.timesPerWeek > 7)
  ) {
    errors.push("La frecuencia semanal debe ser entre 1 y 7 días.");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
