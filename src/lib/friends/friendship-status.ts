export type RelationshipStatus =
  | "none"
  | "request_sent"
  | "request_received"
  | "friends";

export function classifyFriendship(
  row: {
    requesterId: string;
    addresseeId: string;
    status: "pending" | "accepted" | "declined";
  },
  userId: string,
): RelationshipStatus {
  if (row.status === "accepted") return "friends";
  if (row.status === "declined") return "none";
  return row.requesterId === userId ? "request_sent" : "request_received";
}
