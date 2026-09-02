import { describe, expect, it } from "vitest";
import { pickIdea } from "./pick";

describe("pickIdea", () => {
  it("returns null when there are no ideas", () => {
    expect(pickIdea([], new Map())).toBeNull();
  });

  it("picks the only idea available", () => {
    const ideas = [{ id: "a" }];
    expect(pickIdea(ideas, new Map())?.id).toBe("a");
  });

  it("avoids ideas picked recently, favoring ones off cooldown", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const ideas = [{ id: "recent" }, { id: "old" }];
    const lastPickedAt = new Map([
      ["recent", new Date("2026-01-09T00:00:00.000Z")],
      ["old", new Date("2026-01-01T00:00:00.000Z")],
    ]);

    for (let i = 0; i < 20; i++) {
      expect(pickIdea(ideas, lastPickedAt, new Set(), now)?.id).toBe("old");
    }
  });

  it("falls back to the full pool when everything is on cooldown", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const ideas = [{ id: "a" }, { id: "b" }];
    const lastPickedAt = new Map([
      ["a", new Date("2026-01-09T00:00:00.000Z")],
      ["b", new Date("2026-01-09T00:00:00.000Z")],
    ]);

    const result = pickIdea(ideas, lastPickedAt, new Set(), now);
    expect(["a", "b"]).toContain(result?.id);
  });

  it("excludes ids already shown this session", () => {
    const ideas = [{ id: "a" }, { id: "b" }];
    for (let i = 0; i < 20; i++) {
      expect(pickIdea(ideas, new Map(), new Set(["a"]))?.id).toBe("b");
    }
  });

  it("falls back to the full pool when everything is excluded", () => {
    const ideas = [{ id: "a" }, { id: "b" }];
    const result = pickIdea(ideas, new Map(), new Set(["a", "b"]));
    expect(["a", "b"]).toContain(result?.id);
  });
});
