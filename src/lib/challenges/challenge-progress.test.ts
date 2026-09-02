import { describe, expect, it } from "vitest";
import { computeChallengeProgress } from "./challenge-progress";

describe("computeChallengeProgress", () => {
  it("computes total days inclusive of both endpoints", () => {
    const result = computeChallengeProgress(
      "2026-01-01",
      "2026-01-30",
      "2026-01-01",
      0,
      0,
    );
    expect(result.totalDays).toBe(30);
  });

  it("has not started before the start date", () => {
    const result = computeChallengeProgress(
      "2026-02-01",
      "2026-02-28",
      "2026-01-15",
      0,
      0,
    );
    expect(result.hasStarted).toBe(false);
    expect(result.elapsedDays).toBe(0);
  });

  it("caps elapsed days at the total once finished", () => {
    const result = computeChallengeProgress(
      "2026-01-01",
      "2026-01-10",
      "2026-03-01",
      5,
      7,
    );
    expect(result.isFinished).toBe(true);
    expect(result.elapsedDays).toBe(10);
  });

  it("counts elapsed days as of today mid-challenge", () => {
    const result = computeChallengeProgress(
      "2026-01-01",
      "2026-01-30",
      "2026-01-10",
      3,
      4,
    );
    expect(result.hasStarted).toBe(true);
    expect(result.isFinished).toBe(false);
    expect(result.elapsedDays).toBe(10);
    expect(result.myCheckins).toBe(3);
    expect(result.otherCheckins).toBe(4);
  });
});
