import { describe, expect, it } from "vitest";
import { classifyFriendship } from "./friendship-status";

describe("classifyFriendship", () => {
  it("is friends when accepted, regardless of who requested", () => {
    const row = { requesterId: "a", addresseeId: "b", status: "accepted" as const };
    expect(classifyFriendship(row, "a")).toBe("friends");
    expect(classifyFriendship(row, "b")).toBe("friends");
  });

  it("is none when declined", () => {
    const row = { requesterId: "a", addresseeId: "b", status: "declined" as const };
    expect(classifyFriendship(row, "a")).toBe("none");
    expect(classifyFriendship(row, "b")).toBe("none");
  });

  it("is request_sent for the requester and request_received for the addressee when pending", () => {
    const row = { requesterId: "a", addresseeId: "b", status: "pending" as const };
    expect(classifyFriendship(row, "a")).toBe("request_sent");
    expect(classifyFriendship(row, "b")).toBe("request_received");
  });
});
