import { describe, expect, it } from "vitest";
import { calculateStreak } from "./streak";

describe("calculateStreak", () => {
  it("is zero for an empty history", () => {
    const result = calculateStreak({
      frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 7 }],
      completedDates: [],
      today: "2026-01-05",
    });

    expect(result).toEqual({ currentStreak: 0, maxStreak: 0 });
  });

  it("does not break the streak because the current week is still in progress", () => {
    const result = calculateStreak({
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
      today: "2026-01-14",
    });

    expect(result).toEqual({ currentStreak: 1, maxStreak: 1 });
  });

  it("breaks the current streak on a fully-elapsed unmet week but keeps the historical max", () => {
    const result = calculateStreak({
      frequencyHistory: [{ effectiveFrom: "2025-12-01", timesPerWeek: 7 }],
      completedDates: [
        // Week of 2025-12-22: fully met (streak of 2 historically)
        "2025-12-22",
        "2025-12-23",
        "2025-12-24",
        "2025-12-25",
        "2025-12-26",
        "2025-12-27",
        "2025-12-28",
        // Week of 2025-12-29: fully met
        "2025-12-29",
        "2025-12-30",
        "2025-12-31",
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
        // Week of 2026-01-05: NOT met (gap, breaks streak)
        // Week of 2026-01-12: current, no entries yet (partial, doesn't break)
      ],
      today: "2026-01-14",
    });

    expect(result).toEqual({ currentStreak: 0, maxStreak: 2 });
  });

  it("uses the frequency that was active during each week when it changed mid-history", () => {
    const result = calculateStreak({
      frequencyHistory: [
        // Started as 2x/week...
        { effectiveFrom: "2026-01-05", timesPerWeek: 2 },
        // ...bumped to 5x/week starting the week of 2026-01-12
        { effectiveFrom: "2026-01-12", timesPerWeek: 5 },
      ],
      completedDates: [
        // Week of 2026-01-05: only 2 completions, but target was 2 back then -> met
        "2026-01-05",
        "2026-01-06",
        // Week of 2026-01-12 (current, partial): 3 completions so far, target is now 5 -> not met yet
        "2026-01-12",
        "2026-01-13",
        "2026-01-14",
      ],
      today: "2026-01-14",
    });

    expect(result).toEqual({ currentStreak: 1, maxStreak: 1 });
  });

  it("freezes the calculation at archivedAt, ignoring how much later today is", () => {
    const result = calculateStreak({
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
      today: "2026-06-01",
      archivedAt: "2026-01-11",
    });

    expect(result).toEqual({ currentStreak: 1, maxStreak: 1 });
  });

  it("counts a week as met when completions exactly equal the target", () => {
    const result = calculateStreak({
      frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 3 }],
      completedDates: ["2026-01-05", "2026-01-06", "2026-01-07"],
      today: "2026-01-11",
      archivedAt: "2026-01-11",
    });

    expect(result).toEqual({ currentStreak: 1, maxStreak: 1 });
  });

  it("does not count a week as met when one completion short of the target", () => {
    const result = calculateStreak({
      frequencyHistory: [{ effectiveFrom: "2026-01-05", timesPerWeek: 3 }],
      completedDates: ["2026-01-05", "2026-01-06"],
      today: "2026-01-11",
      archivedAt: "2026-01-11",
    });

    expect(result).toEqual({ currentStreak: 0, maxStreak: 0 });
  });

  it("handles a long gap of inactivity between two streaks", () => {
    const result = calculateStreak({
      frequencyHistory: [{ effectiveFrom: "2025-06-01", timesPerWeek: 7 }],
      completedDates: [
        // A met week back in June
        "2025-06-02",
        "2025-06-03",
        "2025-06-04",
        "2025-06-05",
        "2025-06-06",
        "2025-06-07",
        "2025-06-08",
        // ...then months of nothing...
        // Current week (fully elapsed relative to archivedAt), also met
        "2026-01-05",
        "2026-01-06",
        "2026-01-07",
        "2026-01-08",
        "2026-01-09",
        "2026-01-10",
        "2026-01-11",
      ],
      today: "2026-01-11",
      archivedAt: "2026-01-11",
    });

    expect(result).toEqual({ currentStreak: 1, maxStreak: 1 });
  });

  it("aligns weeks correctly when the habit starts mid-week", () => {
    const result = calculateStreak({
      // Habit created on a Thursday
      frequencyHistory: [{ effectiveFrom: "2026-01-08", timesPerWeek: 2 }],
      completedDates: ["2026-01-08", "2026-01-09"],
      today: "2026-01-11",
      archivedAt: "2026-01-11",
    });

    expect(result).toEqual({ currentStreak: 1, maxStreak: 1 });
  });

  it("keeps the streak alive when a missed week is frozen", () => {
    const result = calculateStreak({
      frequencyHistory: [{ effectiveFrom: "2025-12-01", timesPerWeek: 7 }],
      completedDates: [
        // Week of 2025-12-22: met
        "2025-12-22",
        "2025-12-23",
        "2025-12-24",
        "2025-12-25",
        "2025-12-26",
        "2025-12-27",
        "2025-12-28",
        // Week of 2025-12-29: NOT met, but frozen
        // Week of 2026-01-05: met
        "2026-01-05",
        "2026-01-06",
        "2026-01-07",
        "2026-01-08",
        "2026-01-09",
        "2026-01-10",
        "2026-01-11",
      ],
      today: "2026-01-11",
      archivedAt: "2026-01-11",
      frozenWeeks: ["2025-12-29"],
    });

    expect(result).toEqual({ currentStreak: 3, maxStreak: 3 });
  });

  it("does not freeze a week that was not listed as frozen", () => {
    const result = calculateStreak({
      frequencyHistory: [{ effectiveFrom: "2025-12-01", timesPerWeek: 7 }],
      completedDates: [
        "2025-12-22",
        "2025-12-23",
        "2025-12-24",
        "2025-12-25",
        "2025-12-26",
        "2025-12-27",
        "2025-12-28",
      ],
      today: "2026-01-11",
      archivedAt: "2026-01-11",
      frozenWeeks: ["2026-02-02"],
    });

    expect(result).toEqual({ currentStreak: 0, maxStreak: 1 });
  });
});
