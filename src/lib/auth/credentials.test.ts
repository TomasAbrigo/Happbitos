import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./credentials";

describe("credentials", () => {
  it("verifies the correct password against its hash", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(
      verifyPassword("correct horse battery staple", hash),
    ).resolves.toBe(true);
  });

  it("rejects an incorrect password against a hash", async () => {
    const hash = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("wrong password", hash)).resolves.toBe(
      false,
    );
  });
});
