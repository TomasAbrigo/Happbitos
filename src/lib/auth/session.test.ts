import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

const secret = "test-secret-value-not-for-real-use";

describe("session", () => {
  it("round-trips a userId through a signed token", async () => {
    const token = await createSessionToken({ userId: "user-1" }, secret);

    await expect(verifySessionToken(token, secret)).resolves.toEqual({
      userId: "user-1",
    });
  });

  it("rejects a tampered token", async () => {
    const token = await createSessionToken({ userId: "user-1" }, secret);
    const tampered = token.slice(0, -1) + (token.at(-1) === "a" ? "b" : "a");

    await expect(verifySessionToken(tampered, secret)).resolves.toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken({ userId: "user-1" }, secret);

    await expect(
      verifySessionToken(token, "a-completely-different-secret"),
    ).resolves.toBeNull();
  });
});
