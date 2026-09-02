import { describe, expect, it } from "vitest";
import { computeBestWeekday, computeMonthComparison } from "./trends";

describe("computeBestWeekday", () => {
  it("returns null when there is not enough sample data", () => {
    const entries = [
      { date: "2026-01-05", completed: true }, // Monday
      { date: "2026-01-12", completed: true }, // Monday
    ];
    expect(computeBestWeekday(entries)).toBeNull();
  });

  it("picks the weekday with the highest completion rate", () => {
    const entries = [
      // Monday: 3/3
      { date: "2026-01-05", completed: true },
      { date: "2026-01-12", completed: true },
      { date: "2026-01-19", completed: true },
      // Tuesday: 1/3
      { date: "2026-01-06", completed: true },
      { date: "2026-01-13", completed: false },
      { date: "2026-01-20", completed: false },
    ];
    const result = computeBestWeekday(entries);
    expect(result?.label).toBe("Lunes");
    expect(result?.rate).toBe(1);
    expect(result?.sampleSize).toBe(3);
  });
});

describe("computeMonthComparison", () => {
  it("compares this month against last month", () => {
    const entries = [
      { date: "2026-02-01", completed: true },
      { date: "2026-02-02", completed: true },
      { date: "2026-02-03", completed: false },
      { date: "2026-01-15", completed: true },
      { date: "2026-01-16", completed: false },
    ];
    const result = computeMonthComparison(entries, "2026-02-10");
    expect(result.thisMonthRate).toBeCloseTo(2 / 3);
    expect(result.lastMonthRate).toBeCloseTo(1 / 2);
    expect(result.delta).toBeCloseTo(2 / 3 - 1 / 2);
  });

  it("handles a January today crossing into the previous December", () => {
    const entries = [
      { date: "2026-01-05", completed: true },
      { date: "2025-12-20", completed: true },
      { date: "2025-12-21", completed: true },
    ];
    const result = computeMonthComparison(entries, "2026-01-10");
    expect(result.thisMonthRate).toBe(1);
    expect(result.lastMonthRate).toBe(1);
    expect(result.lastMonthSample).toBe(2);
  });

  it("returns zero rates when there is no data for a month", () => {
    const result = computeMonthComparison([], "2026-02-10");
    expect(result).toEqual({
      thisMonthRate: 0,
      lastMonthRate: 0,
      thisMonthSample: 0,
      lastMonthSample: 0,
      delta: 0,
    });
  });
});
