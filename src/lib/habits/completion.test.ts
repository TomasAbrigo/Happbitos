import { describe, expect, it } from "vitest";
import { isCompleted } from "./completion";

describe("isCompleted", () => {
  it("is false when there is no entry for the day", () => {
    expect(isCompleted({ type: "binary" }, undefined)).toBe(false);
  });

  it("is true for a binary habit checked as completed", () => {
    expect(
      isCompleted({ type: "binary" }, { completed: true }),
    ).toBe(true);
  });

  it("is false for a binary habit checked as not completed", () => {
    expect(
      isCompleted({ type: "binary" }, { completed: false }),
    ).toBe(false);
  });

  it("is false for a quantity habit below its target", () => {
    expect(
      isCompleted({ type: "quantity", target: 2 }, { quantity: 1 }),
    ).toBe(false);
  });

  it("is true for a quantity habit exactly at its target", () => {
    expect(
      isCompleted({ type: "quantity", target: 2 }, { quantity: 2 }),
    ).toBe(true);
  });

  it("is true for a quantity habit above its target", () => {
    expect(
      isCompleted({ type: "quantity", target: 2 }, { quantity: 3 }),
    ).toBe(true);
  });

  it("is false for a quantity habit with no quantity logged", () => {
    expect(
      isCompleted({ type: "quantity", target: 2 }, { quantity: null }),
    ).toBe(false);
  });
});
