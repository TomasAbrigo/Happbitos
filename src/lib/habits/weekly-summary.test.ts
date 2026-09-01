import { describe, expect, it } from "vitest";
import { generateWeeklySummary } from "./weekly-summary";

describe("generateWeeklySummary", () => {
  it("reports 100% completion for a fully met week", () => {
    const result = generateWeeklySummary({
      today: "2026-01-11",
      weekStart: "2026-01-05",
      habits: [
        {
          habitId: "h1",
          name: "Leer",
          frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 7 }],
          completedDates: [
            "2026-01-05",
            "2026-01-06",
            "2026-01-07",
            "2026-01-08",
            "2026-01-09",
            "2026-01-10",
            "2026-01-11",
          ],
        },
      ],
    });

    expect(result).toEqual([
      {
        habitId: "h1",
        name: "Leer",
        completionRate: 1,
        currentStreak: 1,
        maxStreak: 1,
      },
    ]);
  });

  it("reports a fractional completion rate for a partially met week", () => {
    const result = generateWeeklySummary({
      today: "2026-01-11",
      weekStart: "2026-01-05",
      habits: [
        {
          habitId: "h1",
          name: "Ejercicio",
          frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 3 }],
          completedDates: ["2026-01-05", "2026-01-06"],
        },
      ],
    });

    expect(result[0].completionRate).toBeCloseTo(2 / 3);
  });

  it("combines multiple habits with different frequencies and statuses into one summary", () => {
    const result = generateWeeklySummary({
      today: "2026-01-11",
      weekStart: "2026-01-05",
      habits: [
        {
          habitId: "active-daily",
          name: "Leer",
          frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 7 }],
          completedDates: [
            "2026-01-05",
            "2026-01-06",
            "2026-01-07",
            "2026-01-08",
            "2026-01-09",
            "2026-01-10",
            "2026-01-11",
          ],
        },
        {
          habitId: "archived-weekly",
          name: "Yoga",
          frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 2 }],
          completedDates: ["2026-01-05", "2026-01-06"],
          archivedAt: "2026-01-06",
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ habitId: "active-daily", completionRate: 1 });
    expect(result[1]).toMatchObject({
      habitId: "archived-weekly",
      completionRate: 1,
      currentStreak: 1,
      maxStreak: 1,
    });
  });

  it("caps completion rate at 100% when completions exceed the target", () => {
    const result = generateWeeklySummary({
      today: "2026-01-11",
      weekStart: "2026-01-05",
      habits: [
        {
          habitId: "h1",
          name: "Agua",
          frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 2 }],
          completedDates: ["2026-01-05", "2026-01-06", "2026-01-07"],
        },
      ],
    });

    expect(result[0].completionRate).toBe(1);
  });
});
