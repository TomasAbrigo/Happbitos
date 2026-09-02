import { describe, expect, it } from "vitest";
import { computePerfectDays, computeTeamStreak } from "./team-streak";

describe("computePerfectDays", () => {
  it("marks a day perfect only when every in-scope habit was completed", () => {
    const habits = [{ id: "a", createdAt: "2026-01-01", archivedAt: null }];
    const completed = new Map([["a", new Set(["2026-01-05"])]]);
    const perfect = computePerfectDays(habits, completed, [
      "2026-01-05",
      "2026-01-06",
    ]);
    expect([...perfect]).toEqual(["2026-01-05"]);
  });

  it("requires all habits in scope that day to be completed", () => {
    const habits = [
      { id: "a", createdAt: "2026-01-01", archivedAt: null },
      { id: "b", createdAt: "2026-01-01", archivedAt: null },
    ];
    const completed = new Map([
      ["a", new Set(["2026-01-05"])],
      ["b", new Set<string>()],
    ]);
    const perfect = computePerfectDays(habits, completed, ["2026-01-05"]);
    expect(perfect.size).toBe(0);
  });

  it("excludes habits not yet created or already archived on that day", () => {
    const habits = [
      { id: "a", createdAt: "2026-01-10", archivedAt: null },
      { id: "b", createdAt: "2026-01-01", archivedAt: "2026-01-04" },
    ];
    const completed = new Map<string, Set<string>>();
    // Neither habit is in scope on 2026-01-05 (a not started, b archived), so no habits => not perfect
    const perfect = computePerfectDays(habits, completed, ["2026-01-05"]);
    expect(perfect.size).toBe(0);
  });

  it("does not count a day as perfect when nobody had any habit in scope", () => {
    const perfect = computePerfectDays([], new Map(), ["2026-01-05"]);
    expect(perfect.size).toBe(0);
  });
});

describe("computeTeamStreak", () => {
  const dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04"];

  it("is zero when nothing lines up", () => {
    const result = computeTeamStreak(new Set(), new Set(), dates, "2026-01-04");
    expect(result).toEqual({ currentStreak: 0, maxStreak: 0 });
  });

  it("counts consecutive days where both were perfect", () => {
    const a = new Set(["2026-01-02", "2026-01-03", "2026-01-04"]);
    const b = new Set(["2026-01-02", "2026-01-03", "2026-01-04"]);
    const result = computeTeamStreak(a, b, dates, "2026-01-04");
    expect(result).toEqual({ currentStreak: 3, maxStreak: 3 });
  });

  it("breaks the current streak on a day only one of them nailed", () => {
    const a = new Set(["2026-01-01", "2026-01-02", "2026-01-04"]);
    const b = new Set(["2026-01-01", "2026-01-02", "2026-01-04"]);
    // 01-03 missing for both -> breaks; only 01-04 continues
    const result = computeTeamStreak(a, b, dates, "2026-01-04");
    expect(result).toEqual({ currentStreak: 1, maxStreak: 2 });
  });

  it("does not break the streak when today is still in progress", () => {
    const a = new Set(["2026-01-01", "2026-01-02", "2026-01-03"]);
    const b = new Set(["2026-01-01", "2026-01-02", "2026-01-03"]);
    // today (01-04) not perfect yet, but shouldn't break it
    const result = computeTeamStreak(a, b, dates, "2026-01-04");
    expect(result).toEqual({ currentStreak: 3, maxStreak: 3 });
  });
});
