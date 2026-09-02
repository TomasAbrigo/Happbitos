import { describe, expect, it } from "vitest";
import { getPulseQuip } from "./team-pulse";

describe("getPulseQuip", () => {
  it("says there is nobody to compare with when there is no friend", () => {
    expect(getPulseQuip({ username: "me", done: 1, total: 2 }, null)).toBe(
      "Todavía no hay con quién comparar.",
    );
  });

  it("declares a tie when rates match", () => {
    const me = { username: "me", done: 1, total: 2 };
    const friend = { username: "ana", done: 2, total: 4 };
    expect(getPulseQuip(me, friend)).toBe("Están empatados. Nadie afloja.");
  });

  it("says the user is winning when their rate is higher", () => {
    const me = { username: "me", done: 3, total: 4 };
    const friend = { username: "ana", done: 1, total: 4 };
    expect(getPulseQuip(me, friend)).toBe("Le ganás a ana hoy.");
  });

  it("says the friend is winning when their rate is higher", () => {
    const me = { username: "me", done: 1, total: 4 };
    const friend = { username: "ana", done: 3, total: 4 };
    expect(getPulseQuip(me, friend)).toBe("ana te está ganando hoy.");
  });

  it("handles both sides having zero habits", () => {
    const me = { username: "me", done: 0, total: 0 };
    const friend = { username: "ana", done: 0, total: 0 };
    expect(getPulseQuip(me, friend)).toBe(
      "Ninguno de los dos tiene hábitos activos.",
    );
  });
});
