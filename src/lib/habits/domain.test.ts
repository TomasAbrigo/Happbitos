import { describe, expect, it } from "vitest";
import { validateHabitInput } from "./domain";

describe("validateHabitInput", () => {
  it("rejects an empty name", () => {
    const result = validateHabitInput({
      name: "  ",
      type: "binary",
      frequency: { kind: "daily" },
    });

    expect(result).toEqual({
      valid: false,
      errors: ["El nombre es requerido."],
    });
  });

  it("rejects a quantity habit without a target", () => {
    const result = validateHabitInput({
      name: "Tomar agua",
      type: "quantity",
      frequency: { kind: "daily" },
    });

    expect(result).toEqual({
      valid: false,
      errors: ["La meta numérica es requerida para hábitos de cantidad."],
    });
  });

  it("rejects a quantity habit with a target of zero or less", () => {
    const result = validateHabitInput({
      name: "Tomar agua",
      type: "quantity",
      target: 0,
      frequency: { kind: "daily" },
    });

    expect(result).toEqual({
      valid: false,
      errors: ["La meta numérica es requerida para hábitos de cantidad."],
    });
  });

  it("rejects n_per_week frequency with timesPerWeek out of range", () => {
    const result = validateHabitInput({
      name: "Ejercicio",
      type: "binary",
      frequency: { kind: "n_per_week", timesPerWeek: 8 },
    });

    expect(result).toEqual({
      valid: false,
      errors: ["La frecuencia semanal debe ser entre 1 y 7 días."],
    });
  });

  it("accepts a valid binary daily habit", () => {
    const result = validateHabitInput({
      name: "Leer",
      type: "binary",
      frequency: { kind: "daily" },
    });

    expect(result).toEqual({ valid: true });
  });

  it("accepts a valid quantity habit with n_per_week frequency", () => {
    const result = validateHabitInput({
      name: "Tomar agua",
      type: "quantity",
      target: 2,
      frequency: { kind: "n_per_week", timesPerWeek: 3 },
    });

    expect(result).toEqual({ valid: true });
  });
});
