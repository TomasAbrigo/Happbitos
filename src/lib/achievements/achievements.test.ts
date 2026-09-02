import { describe, expect, it } from "vitest";
import { computeAchievements } from "./achievements";

const ZERO_INPUT = {
  totalCompletedEntries: 0,
  bestStreakEver: 0,
  activeHabitCount: 0,
  oldestActiveHabitDays: 0,
  ideaPicksCount: 0,
  reactionsCount: 0,
};

describe("computeAchievements", () => {
  it("unlocks nothing for a brand new user", () => {
    const result = computeAchievements(ZERO_INPUT);
    expect(result.every((a) => !a.unlocked)).toBe(true);
    expect(result).toHaveLength(9);
  });

  it("unlocks streak milestones cumulatively", () => {
    const result = computeAchievements({ ...ZERO_INPUT, bestStreakEver: 8 });
    const byId = Object.fromEntries(result.map((a) => [a.id, a.unlocked]));
    expect(byId["streak-4"]).toBe(true);
    expect(byId["streak-8"]).toBe(true);
    expect(byId["streak-12"]).toBe(false);
    expect(byId["streak-20"]).toBe(false);
  });

  it("unlocks the rest independently of streaks", () => {
    const result = computeAchievements({
      ...ZERO_INPUT,
      totalCompletedEntries: 1,
      activeHabitCount: 3,
      oldestActiveHabitDays: 61,
      ideaPicksCount: 2,
      reactionsCount: 1,
    });
    const byId = Object.fromEntries(result.map((a) => [a.id, a.unlocked]));
    expect(byId["first-step"]).toBe(true);
    expect(byId["multitask"]).toBe(true);
    expect(byId["veteran"]).toBe(true);
    expect(byId["explorer"]).toBe(true);
    expect(byId["social"]).toBe(true);
    expect(byId["streak-4"]).toBe(false);
  });
});
