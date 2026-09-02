import { describe, expect, it } from "vitest";
import {
  computeAchievements,
  levelFor,
  pointsToNextLevel,
  totalPoints,
} from "./achievements";

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

describe("totalPoints", () => {
  it("is zero when nothing is unlocked", () => {
    expect(totalPoints(computeAchievements(ZERO_INPUT))).toBe(0);
  });

  it("sums only the unlocked achievements", () => {
    const result = computeAchievements({
      ...ZERO_INPUT,
      totalCompletedEntries: 1, // first-step: 10
      bestStreakEver: 8, // streak-4: 20, streak-8: 30
    });
    expect(totalPoints(result)).toBe(60);
  });
});

describe("levelFor", () => {
  it("starts at level 1 with zero points", () => {
    expect(levelFor(0)).toBe(1);
  });

  it("levels up every 50 points", () => {
    expect(levelFor(49)).toBe(1);
    expect(levelFor(50)).toBe(2);
    expect(levelFor(120)).toBe(3);
  });
});

describe("pointsToNextLevel", () => {
  it("counts down to the next threshold", () => {
    expect(pointsToNextLevel(0)).toBe(50);
    expect(pointsToNextLevel(40)).toBe(10);
    expect(pointsToNextLevel(50)).toBe(50);
  });
});
